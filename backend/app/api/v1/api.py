"""
Router principal de la API v1
"""

from fastapi import APIRouter

from app.modules.ml.routes import router as ml_router
# from app.modules.tutorial.routes import router as tutorial_router  # TEMPORALMENTE DESHABILITADO
from app.modules.gamification.routes import router as gamification_router

api_router = APIRouter()

# Incluir routers de módulos
api_router.include_router(
    ml_router,
    prefix="/ml",
    tags=["Machine Learning"]
)

# api_router.include_router(
#     tutorial_router,
#     prefix="/tutorial",
#     tags=["Tutorial"]
# )

api_router.include_router(
    gamification_router,
    prefix="/gamification", 
    tags=["Gamification"]
)

# Endpoints generales de la API
@api_router.get("/")
async def api_root():
    """
    Endpoint raíz de la API v1
    """
    return {
        "message": "COMSIGNS API v1 🤟",
        "version": "1.0.0",
        "modules": [
            "ml - Machine Learning y predicciones",
            "tutorial - Tutorial interactivo", 
            "gamification - Sistema de gamificación (challenges, niveles, puntuaciones)"
        ],
        "documentation": "/docs"
    }

@api_router.get("/version")
async def api_version():
    """
    Información de versión de la API
    """
    return {
        "api_version": "1.0.0",
        "python_version": "3.9+",
        "framework": "FastAPI",
        "ml_framework": "TensorFlow 2.x",
        "language_support": "Ecuatoriano"
    }
