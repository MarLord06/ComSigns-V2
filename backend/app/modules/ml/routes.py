"""
Rutas del módulo ML
"""

import base64
import json
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.supabase import supabase_service
from app.core.config import settings
from app.modules.ml.services import ml_service, tutorial_service, practice_service
from app.modules.ml.schemas import (
    PredictionRequest, PredictionResponse, ModelInfoResponse,
    TutorialStepResponse, TutorialOverviewResponse,
    PracticeSessionRequest, PracticeSessionResponse,
    PracticeResultRequest, PracticeResultResponse,
    TutorialProgressRequest, TutorialProgressResponse
)

router = APIRouter()

def get_or_create_session_id(request: Request) -> str:
    """
    Obtener o crear un session_id único para el usuario
    """
    # Intentar obtener desde headers
    session_id = request.headers.get("X-Session-ID")
    
    if not session_id:
        # Generar nuevo session_id
        session_id = str(uuid.uuid4())
    
    return session_id

@router.get("/model/info", response_model=ModelInfoResponse)
async def get_model_info():
    """
    Obtener información del modelo ML actual
    """
    try:
        info = ml_service.get_model_info()
        return ModelInfoResponse(**info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo información del modelo: {str(e)}")


@router.post("/predict", response_model=PredictionResponse)
async def predict_letter(request: PredictionRequest, http_request: Request, db: AsyncSession = Depends(get_db)):
    """
    Predecir letra basada en imagen de seña
    """
    try:
        # Obtener session_id
        session_id = get_or_create_session_id(http_request)
        
        # Crear sesión de usuario si es necesario
        if supabase_service.is_connected():
            await supabase_service.create_user_session({
                "session_id": session_id,
                "user_agent": http_request.headers.get("User-Agent"),
                "ip_address": str(http_request.client.host) if http_request.client else None
            })
        
        # Decodificar imagen base64
        try:
            image_data = base64.b64decode(request.image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Imagen base64 inválida")
        
        # Procesar landmarks
        landmarks = ml_service.process_landmarks(image_data)
        
        if landmarks is None:
            # Guardar predicción fallida en Supabase
            if supabase_service.is_connected():
                await supabase_service.save_prediction({
                    "session_id": session_id,
                    "predicted_letter": "",
                    "confidence": 0.0,
                    "processing_time_ms": 0.0,
                    "landmarks_data": [],
                    "status": "no_hand_detected"
                })
            
            return PredictionResponse(
                letter="",
                confidence=0.0,
                processing_time_ms=0.0,
                status="no_hand_detected",
                landmarks_detected=False
            )
        
        # Hacer predicción
        result = ml_service.predict_letter(landmarks)
        
        # Guardar predicción en Supabase
        if supabase_service.is_connected():
            await supabase_service.save_prediction({
                "session_id": session_id,
                "predicted_letter": result["letter"],
                "confidence": result["confidence"],
                "processing_time_ms": result["processing_time_ms"],
                "landmarks_data": landmarks.tolist(),
                "status": result["status"]
            })
        
        response = PredictionResponse(
            letter=result["letter"],
            confidence=result["confidence"],
            processing_time_ms=result["processing_time_ms"],
            status=result["status"],
            landmarks_detected=True
        )
        
        # Agregar session_id a la respuesta en headers
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")


@router.post("/predict/upload", response_model=PredictionResponse)
async def predict_letter_upload(file: UploadFile = File(...), session_id: str = None):
    """
    Predecir letra basada en imagen subida
    """
    try:
        # Verificar tipo de archivo
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
        
        # Leer datos de la imagen
        image_data = await file.read()
        
        # Procesar landmarks
        landmarks = ml_service.process_landmarks(image_data)
        
        if landmarks is None:
            return PredictionResponse(
                letter="",
                confidence=0.0,
                processing_time_ms=0.0,
                status="no_hand_detected",
                landmarks_detected=False
            )
        
        # Hacer predicción
        result = ml_service.predict_letter(landmarks)
        
        return PredictionResponse(
            letter=result["letter"],
            confidence=result["confidence"],
            processing_time_ms=result["processing_time_ms"],
            status=result["status"],
            landmarks_detected=True
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")


# Rutas del Tutorial
@router.get("/tutorial/overview", response_model=TutorialOverviewResponse)
async def get_tutorial_overview():
    """
    Obtener resumen del tutorial interactivo
    """
    try:
        overview = tutorial_service.get_tutorial_overview()
        return TutorialOverviewResponse(**overview)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo resumen del tutorial: {str(e)}")


@router.get("/tutorial/step/{step}", response_model=TutorialStepResponse)
async def get_tutorial_step(step: int):
    """
    Obtener información de un paso específico del tutorial
    """
    try:
        step_info = tutorial_service.get_tutorial_step(step)
        
        if "error" in step_info:
            raise HTTPException(status_code=404, detail="Paso del tutorial no encontrado")
        
        return TutorialStepResponse(**step_info)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo paso del tutorial: {str(e)}")


@router.post("/tutorial/progress", response_model=TutorialProgressResponse)
async def update_tutorial_progress(request: TutorialProgressRequest, http_request: Request, db: AsyncSession = Depends(get_db)):
    """
    Actualizar progreso del tutorial
    """
    try:
        # Obtener session_id
        session_id = get_or_create_session_id(http_request)
        
        # Guardar progreso en Supabase
        if supabase_service.is_connected():
            # Determinar la letra basada en el step
            letters = ["A","B","C","D","E","F","G","H","I","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y"]
            letter = letters[request.current_step - 1] if 1 <= request.current_step <= 24 else "?"
            
            await supabase_service.save_tutorial_progress({
                "session_id": session_id,
                "letter": letter,
                "step_number": request.current_step,
                "is_completed": request.is_completed,
                "attempts": 1,  # TODO: track real attempts
                "time_spent_seconds": 0  # TODO: track real time
            })
        
        completed_steps = list(range(1, request.current_step + 1)) if request.is_completed else list(range(1, request.current_step))
        progress = (len(completed_steps) / 24) * 100  # 24 letras totales
        
        return TutorialProgressResponse(
            user_session=session_id,
            current_step=request.current_step,
            total_steps=24,
            completed_steps=completed_steps,
            is_completed=request.current_step >= 24 and request.is_completed,
            progress_percentage=round(progress, 1)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando progreso del tutorial: {str(e)}")


@router.post("/practice/session", response_model=PracticeSessionResponse)
async def create_practice_session(request: PracticeSessionRequest, http_request: Request, db: AsyncSession = Depends(get_db)):
    """
    Crear nueva sesión de práctica
    """
    try:
        # Obtener session_id
        session_id = get_or_create_session_id(http_request)
        
        session_data = practice_service.create_practice_session(request.difficulty)
        
        # Guardar sesión en Supabase
        practice_session_id = None
        if supabase_service.is_connected():
            practice_session_id = await supabase_service.save_practice_session({
                "session_id": session_id,
                "difficulty": request.difficulty,
                "target_letters": session_data.get("target_letters", []),
                "total_exercises": session_data.get("total_exercises", 0)
            })
        
        # Agregar ID de sesión de práctica a la respuesta
        session_data["practice_session_id"] = practice_session_id
        session_data["user_session"] = session_id
        
        return PracticeSessionResponse(**session_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando sesión de práctica: {str(e)}")


@router.post("/practice/result", response_model=PracticeResultResponse)
async def submit_practice_result(request: PracticeResultRequest, http_request: Request, db: AsyncSession = Depends(get_db)):
    """
    Enviar resultados de sesión de práctica
    """
    try:
        # Obtener session_id
        session_id = get_or_create_session_id(http_request)
        
        results = practice_service.calculate_score(request.predictions, request.target_letters)
        
        # Guardar resultados en Supabase
        if supabase_service.is_connected():
            await supabase_service.save_practice_result({
                "session_id": session_id,
                "practice_session_id": request.practice_session_id,
                "score": results.get("score", 0),
                "accuracy": results.get("accuracy", 0.0),
                "total_time_seconds": results.get("total_time_seconds", 0),
                "correct_predictions": results.get("correct_predictions", 0),
                "total_predictions": results.get("total_predictions", 0),
                "detailed_results": results.get("detailed_results", [])
            })
        
        return PracticeResultResponse(**results)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando resultados de práctica: {str(e)}")


@router.get("/practice/leaderboard")
async def get_practice_leaderboard(difficulty: str = "beginner", limit: int = 10):
    """
    Obtener tabla de clasificación del modo práctica
    """
    try:
        # Obtener datos reales de Supabase
        if supabase_service.is_connected():
            leaderboard_data = await supabase_service.get_leaderboard(difficulty, limit)
            
            if leaderboard_data:
                return {
                    "difficulty": difficulty,
                    "leaderboard": leaderboard_data,
                    "total_players": len(leaderboard_data)
                }
        
        # Fallback a datos de ejemplo si Supabase no está disponible
        return {
            "difficulty": difficulty,
            "leaderboard": [
                {"rank": 1, "score": 2400, "accuracy": 96.0, "session_id": "demo-user-1", "completed_at": "2025-07-22T05:00:00Z"},
                {"rank": 2, "score": 2300, "accuracy": 92.0, "session_id": "demo-user-2", "completed_at": "2025-07-22T04:30:00Z"},
                {"rank": 3, "score": 2200, "accuracy": 88.0, "session_id": "demo-user-3", "completed_at": "2025-07-22T04:15:00Z"},
            ],
            "total_players": 3,
            "note": "Datos de ejemplo - Supabase no configurado"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo tabla de clasificación: {str(e)}")


@router.get("/stats/predictions")
async def get_prediction_stats(http_request: Request, db: AsyncSession = Depends(get_db)):
    """
    Obtener estadísticas de predicciones
    """
    try:
        # Obtener session_id
        session_id = get_or_create_session_id(http_request)
        
        # Obtener estadísticas reales de Supabase
        if supabase_service.is_connected():
            stats = await supabase_service.get_user_statistics(session_id)
            
            if "error" not in stats:
                return {
                    "session_id": session_id,
                    "user_stats": stats,
                    "timestamp": "2025-07-22T05:00:00Z"
                }
        
        # Fallback a datos de ejemplo
        return {
            "session_id": session_id,
            "user_stats": {
                "total_predictions": 0,
                "tutorial_progress": 0,
                "practice_sessions": 0,
                "average_accuracy": 0.0,
                "most_predicted_letters": []
            },
            "note": "Nueva sesión - Sin datos históricos",
            "timestamp": "2025-07-22T05:00:00Z"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")


@router.get("/health")
async def ml_health_check():
    """
    Health check específico del módulo ML
    """
    try:
        model_info = ml_service.get_model_info()
        supabase_status = supabase_service.is_connected()
        
        return {
            "status": "healthy",
            "module": "ml",
            "model_loaded": model_info["model_loaded"],
            "supported_letters": len(model_info["supported_letters"]),
            "supabase_connected": supabase_status,
            "storage": "supabase" if supabase_status else "local",
            "timestamp": "2025-07-22T05:00:00Z"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "module": "ml",
            "error": str(e),
            "supabase_connected": False,
            "timestamp": "2025-07-22T05:00:00Z"
        }


@router.get("/supabase/status")
async def supabase_status_check():
    """
    Verificar estado específico de Supabase
    """
    try:
        is_connected = supabase_service.is_connected()
        
        if is_connected:
            # Intentar una operación simple para verificar conectividad
            test_session_id = str(uuid.uuid4())
            result = await supabase_service.create_user_session({
                "session_id": f"test-{test_session_id}",
                "user_agent": "Health Check",
                "ip_address": "127.0.0.1"
            })
            
            return {
                "status": "connected",
                "supabase_url": settings.SUPABASE_URL[:50] + "..." if settings.SUPABASE_URL else "Not configured",
                "test_operation": "success" if result else "failed",
                "timestamp": "2025-07-22T05:00:00Z"
            }
        else:
            return {
                "status": "not_configured",
                "message": "Supabase credentials not provided - using local storage",
                "supabase_url": "Not configured",
                "timestamp": "2025-07-22T05:00:00Z"
            }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": "2025-07-22T05:00:00Z"
        }
