from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from app.config import settings
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.verification import router as verify_router
from app.api.admin import router as admin_router
from app.api.health import router as health_router

app = FastAPI(
    title="DocSeal API",
    description="Digital Document Verification & Integrity Platform using IPFS and SHA-256 (Zero-SQL)",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(verify_router)
app.include_router(admin_router)

# Mount static files and templates
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_file = TEMPLATES_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return HTMLResponse("<h1>DocSeal API is Running</h1><p>Visit /docs for Swagger API documentation.</p>")

@app.get("/verify/{document_id}", response_class=HTMLResponse)
async def serve_verify_page(document_id: str):
    """Deep link to verification page with document_id parameter."""
    index_file = TEMPLATES_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return HTMLResponse(f"<h1>DocSeal Verification</h1><p>Document: {document_id}</p>")
