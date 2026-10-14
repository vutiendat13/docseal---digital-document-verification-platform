from fastapi import Depends, HTTPException, status
from app.models.entities import User, UserRole
from app.security.auth import get_current_user

def require_role(allowed_roles: list[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Quyền truy cập bị từ chối. Chức năng này yêu cầu vai trò: {', '.join([r.value for r in allowed_roles])}."
            )
        return current_user
    return role_checker

require_admin = require_role([UserRole.ADMIN])
require_verifier_or_admin = require_role([UserRole.ADMIN, UserRole.VERIFIER])
require_user_or_above = require_role([UserRole.ADMIN, UserRole.VERIFIER, UserRole.USER])
