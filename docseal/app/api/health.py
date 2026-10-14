from fastapi import APIRouter
from app.config import settings
from app.services.ipfs_service import ipfs_service

router = APIRouter(tags=["Health"])

@router.get("/api/health")
def health_check():
    ipfs_status = ipfs_service.check_health()
    return {
        "status": "HEALTHY",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database_type": "JSON_PERSISTENCE (Zero-SQL)",
        "ipfs_daemon": ipfs_status
    }
