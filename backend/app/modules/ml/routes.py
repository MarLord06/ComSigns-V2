"""
Rutas del módulo ML
"""

import base64
import json
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, WebSocket
from fastapi import WebSocketDisconnect  # añadido para manejar desconexiones

from app.core.simple_supabase import get_simple_supabase_service
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

# Función para obtener el servicio Supabase
def get_supabase_service():
    """Obtener servicio Supabase"""
    return get_simple_supabase_service()

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

# Nuevo helper para WebSocket
def get_or_create_session_id_ws(websocket: WebSocket) -> str:
    """
    Obtener o crear un session_id único para WebSocket
    """
    session_id = websocket.headers.get("x-session-id") or websocket.headers.get("X-Session-ID")
    if not session_id:
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


@router.websocket("/predict")
async def predict_letter(websocket: WebSocket):
    """
    Predecir letra basada en imagen de seña
    """
    # Obtener session_id
    await websocket.accept()
    session_id = get_or_create_session_id_ws(websocket)

    # Crear sesión de usuario (si procede)
    supabase_service = get_supabase_service()
    if supabase_service.is_connected():
        await supabase_service.create_user_session({
            "session_id": session_id,
            "user_agent": websocket.headers.get("user-agent") or websocket.headers.get("User-Agent"),
            "ip_address": str(websocket.client.host) if websocket.client else None
        })

    # Enviar mensaje inicial de sesión
    await websocket.send_json({
        "type": "session",
        "session_id": session_id,
        "message": "connected"
    })

    try:
        while True:
            try:
                raw_msg = await websocket.receive_text()
            except WebSocketDisconnect:
                break

            # Intentar parsear JSON
            try:
                payload = json.loads(raw_msg)
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "error": "Formato JSON inválido",
                    "session_id": session_id
                })
                continue

            msg_type = payload.get("type")

            if msg_type == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": uuid.uuid4().hex  # simple token de respuesta
                })
                continue

            if msg_type != "frame":
                await websocket.send_json({
                    "type": "error",
                    "error": "Tipo de mensaje no soportado",
                    "session_id": session_id
                })
                continue

            # Obtener imagen base64
            b64_image = payload.get("image")
            if not b64_image:
                await websocket.send_json({
                    "type": "error",
                    "error": "Campo 'image' requerido",
                    "session_id": session_id
                })
                continue

            # Remover encabezado data URL si existe
            if b64_image.startswith("data:"):
                try:
                    b64_image = b64_image.split(",", 1)[1]
                except Exception:
                    await websocket.send_json({
                        "type": "error",
                        "error": "Formato data URL inválido",
                        "session_id": session_id
                    })
                    continue

            # Decodificar
            try:
                image_data = base64.b64decode(b64_image)
            except Exception:
                await websocket.send_json({
                    "type": "error",
                    "error": "Imagen base64 inválida",
                    "session_id": session_id
                })
                continue

            # Procesar landmarks
            landmarks = ml_service.process_landmarks(image_data)

            if landmarks is None:
                # Guardar intento fallido
                supabase_service = get_supabase_service()
                if supabase_service.is_connected():
                    await supabase_service.save_ml_prediction(
                        session_id=session_id,
                        user_id="dev-user-001",  # Usuario por defecto para desarrollo
                        prediction_data={
                            "predicted_letter": "",
                            "status": "no_hand_detected",
                            "processing_time_ms": 0.0,
                            "landmarks_data": []
                        },
                        confidence=0.0
                    )

                await websocket.send_json({
                    "type": "prediction",
                    "letter": "",
                    "confidence": 0.0,
                    "processing_time_ms": 0.0,
                    "status": "no_hand_detected",
                    "landmarks_detected": False,
                    "session_id": session_id
                })
                continue

            # Predicción
            result = ml_service.predict_letter(landmarks)

            # Persistir predicción exitosa
            supabase_service = get_supabase_service()
            if supabase_service.is_connected():
                await supabase_service.save_ml_prediction(
                    session_id=session_id,
                    user_id="dev-user-001",  # Usuario por defecto para desarrollo
                    prediction_data={
                        "predicted_letter": result["letter"],
                        "status": result["status"],
                        "processing_time_ms": result["processing_time_ms"],
                        "landmarks_data": landmarks.tolist()
                    },
                    confidence=result["confidence"]
                )

            await websocket.send_json({
                "type": "prediction",
                "letter": result["letter"],
                "confidence": result["confidence"],
                "processing_time_ms": result["processing_time_ms"],
                "status": result["status"],
                "landmarks_detected": True,
                "session_id": session_id
            })

    except WebSocketDisconnect:
        # Desconexión normal
        pass
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "error": f"Error interno: {str(e)}",
            "session_id": session_id
        })
        # Opcional: cerrar el socket
        try:
            await websocket.close()
        except Exception:
            pass


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
@router.get("/tutorial/step/{step}", response_model=TutorialStepResponse)
async def get_tutorial_step(step: int):
    """
    Obtener información de un paso específico del tutorial
    """
    try:
        step_info = await tutorial_service.get_tutorial_step(step)
        
        if "error" in step_info:
            raise HTTPException(status_code=404, detail="Paso del tutorial no encontrado")
        
        return TutorialStepResponse(**step_info)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo paso del tutorial: {str(e)}")


@router.get("/tutorial/overview", response_model=TutorialOverviewResponse)
async def get_tutorial_overview():
    """
    Obtener resumen del tutorial interactivo
    """
    try:
        overview = await tutorial_service.get_tutorial_overview()
        return TutorialOverviewResponse(**overview)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo resumen del tutorial: {str(e)}")


@router.post("/tutorial/progress", response_model=TutorialProgressResponse)
async def update_tutorial_progress(request: TutorialProgressRequest, http_request: Request):
    """
    Actualizar progreso del tutorial
    """
    try:
        # Obtener session_id
        session_id = get_or_create_session_id(http_request)
        
        # Guardar progreso en Supabase
        supabase_service = get_supabase_service()
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
async def create_practice_session(request: PracticeSessionRequest, http_request: Request):
    """
    Crear nueva sesión de práctica
    """
    try:
        # Obtener session_id
        session_id = get_or_create_session_id(http_request)
        
        session_data = practice_service.create_practice_session(request.difficulty)
        
        # Guardar sesión en Supabase
        practice_session_id = None
        supabase_service = get_supabase_service()
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
async def submit_practice_result(request: PracticeResultRequest, http_request: Request):
    """
    Enviar resultados de sesión de práctica
    """
    try:
        # Obtener session_id
        session_id = get_or_create_session_id(http_request)
        
        results = practice_service.calculate_score(request.predictions, request.target_letters)
        
        # Guardar resultados en Supabase
        supabase_service = get_supabase_service()
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
        supabase_service = get_supabase_service()
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
async def get_prediction_stats(http_request: Request):
    """
    Obtener estadísticas de predicciones
    """
    try:
        # Obtener session_id
        session_id = get_or_create_session_id(http_request)
        
        # Obtener estadísticas reales de Supabase
        supabase_service = get_supabase_service()
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
        supabase_service = get_supabase_service()
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
        supabase_service = get_supabase_service()
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
