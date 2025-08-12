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
    openapi_url=None if settings.ENVIRONMENT == "production" else f"{settings.API_V1_STR}/openapi.json",
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
)

# Configurar contenedor de dependencias

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
# Incluir routers de la API
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

@app.get("/metrics")
async def get_metrics():
    """
    Endpoint para métricas de performance
    """
    # Obtener middleware de performance
    performance_middleware = None
    for middleware in app.user_middleware:
        if isinstance(middleware.cls, type) and issubclass(middleware.cls):
            performance_middleware = middleware.cls
            break
    
    if performance_middleware and hasattr(performance_middleware, 'get_metrics_summary'):
        return performance_middleware.get_metrics_summary()
    
    return {"message": "Performance metrics not available"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False,
        log_level=settings.LOG_LEVEL.lower()
    )
