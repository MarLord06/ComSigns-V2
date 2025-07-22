"""
COMSIGNS Backend API
Sistema de traducción de lenguaje de señas ecuatoriano
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.middleware import LoggingMiddleware
from app.api.v1.api import api_router

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API para traducción de lenguaje de señas ecuatoriano en tiempo real",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.ENVIRONMENT != "production" else None,
)

# Middleware de seguridad
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.vercel.app"]
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware personalizado
app.add_middleware(LoggingMiddleware)

# Incluir routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Health check endpoint
@app.get("/")
async def root():
    """
    Endpoint raíz - Health check
    """
    return {
        "message": "COMSIGNS API está funcionando correctamente 🤟",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": f"{settings.API_V1_STR}/docs" if settings.ENVIRONMENT != "production" else None
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint para monitoreo
    """
    return {
        "status": "healthy",
        "service": "comsigns-api",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False,
        log_level=settings.LOG_LEVEL.lower()
    )
