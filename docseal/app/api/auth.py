import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.repositories.json_repo import users_repo
from app.models.entities import User, UserRole
from app.models.schemas import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.security.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.security.rate_limiter import login_limiter
from app.services.audit_service import audit_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(req: UserRegisterRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    # Check if email exists
    existing = users_repo.find_by("email", req.email.lower().strip())
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký trên hệ thống."
        )

    now_iso = datetime.utcnow().isoformat() + "Z"
    user_id = f"usr-{uuid.uuid4().hex[:8]}"

    new_user = User(
        id=user_id,
        email=req.email.lower().strip(),
        full_name=req.full_name.strip(),
        role=UserRole.USER,  # Default role is always USER
        password_hash=get_password_hash(req.password),
        is_active=True,
        created_at=now_iso,
        last_login=now_iso
    )
    users_repo.insert(new_user.model_dump())

    audit_service.log_action(
        user_email=new_user.email,
        action="USER_REGISTER",
        ip_address=client_ip,
        details=f"Đăng ký tài khoản mới: {new_user.email} (Họ tên: {new_user.full_name})"
    )

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role.value})
    user_dict = new_user.model_dump()
    user_dict.pop("password_hash", None)

    return {"access_token": token, "token_type": "bearer", "user": user_dict}

@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    rate_key = f"{client_ip}:{req.email.lower().strip()}"
    login_limiter.check(rate_key)

    user_data = users_repo.find_by("email", req.email.lower().strip())
    if not user_data or not verify_password(req.password, user_data.get("password_hash", "")):
        audit_service.log_action(
            user_email=req.email,
            action="LOGIN_FAILED",
            ip_address=client_ip,
            status="FAILED",
            details="Đăng nhập không thành công: Sai mật khẩu hoặc tài khoản không tồn tại."
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thông tin đăng nhập không chính xác hoặc tài khoản không tồn tại."
        )

    if not user_data.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản này đang bị khóa. Vui lòng liên hệ quản trị viên."
        )

    # Update last login
    now_iso = datetime.utcnow().isoformat() + "Z"
    users_repo.update("id", user_data["id"], {"last_login": now_iso})

    audit_service.log_action(
        user_email=user_data["email"],
        action="LOGIN_SUCCESS",
        ip_address=client_ip,
        details="Đăng nhập thành công vào hệ thống."
    )

    token = create_access_token({
        "sub": user_data["id"],
        "email": user_data["email"],
        "role": user_data.get("role", "USER")
    })
    safe_user = dict(user_data)
    safe_user.pop("password_hash", None)

    return {"access_token": token, "token_type": "bearer", "user": safe_user}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    audit_service.log_action(
        user_email=current_user.email,
        action="LOGOUT",
        details="Đăng xuất khỏi phiên làm việc."
    )
    return {"message": "Đăng xuất thành công."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )
