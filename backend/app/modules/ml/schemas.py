"""
Schemas de Pydantic para el módulo ML
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class PredictionRequest(BaseModel):
    """
    Request para predicción de letra
    """
    image_data: str = Field(..., description="Imagen en base64")
    session_id: Optional[str] = Field(None, description="ID de sesión del usuario")


class PredictionResponse(BaseModel):
    """
    Response de predicción de letra
    """
    letter: str = Field(..., description="Letra predicha")
    confidence: float = Field(..., description="Confianza de la predicción (0-1)")
    processing_time_ms: float = Field(..., description="Tiempo de procesamiento en ms")
    status: str = Field(..., description="Estado de la predicción")
    landmarks_detected: bool = Field(..., description="Si se detectaron landmarks")


class ModelInfoResponse(BaseModel):
    """
    Response con información del modelo
    """
    model_loaded: bool = Field(..., description="Si el modelo está cargado")
    supported_letters: List[str] = Field(..., description="Letras soportadas")
    total_letters: int = Field(..., description="Total de letras")
    confidence_threshold: float = Field(..., description="Umbral de confianza")
    language: str = Field(..., description="Idioma del modelo")
    version: str = Field(..., description="Versión del modelo")


class TutorialStepResponse(BaseModel):
    """
    Response para paso del tutorial
    """
    step: int = Field(..., description="Número del paso actual")
    total_steps: int = Field(..., description="Total de pasos")
    letter: str = Field(..., description="Letra del paso actual")
    description: str = Field(..., description="Descripción de cómo hacer la seña")
    difficulty: str = Field(..., description="Dificultad del paso")
    tips: List[str] = Field(..., description="Consejos para la seña")
    progress: float = Field(..., description="Progreso en porcentaje")


class TutorialOverviewResponse(BaseModel):
    """
    Response con resumen del tutorial
    """
    total_steps: int = Field(..., description="Total de pasos")
    letters: List[str] = Field(..., description="Letras a aprender")
    estimated_time_minutes: int = Field(..., description="Tiempo estimado en minutos")
    difficulty_levels: Dict[str, int] = Field(..., description="Distribución por dificultad")


class PracticeSessionRequest(BaseModel):
    """
    Request para crear sesión de práctica
    """
    difficulty: str = Field(default="beginner", description="Nivel de dificultad")


class PracticeSessionResponse(BaseModel):
    """
    Response de sesión de práctica
    """
    session_id: str = Field(..., description="ID único de la sesión")
    difficulty: str = Field(..., description="Nivel de dificultad")
    target_letters: List[str] = Field(..., description="Letras objetivo")
    time_limit_per_letter: int = Field(..., description="Tiempo límite por letra en segundos")
    min_confidence: float = Field(..., description="Confianza mínima requerida")
    total_letters: int = Field(..., description="Total de letras")
    max_score: int = Field(..., description="Puntuación máxima posible")


class PracticeResultRequest(BaseModel):
    """
    Request para enviar resultados de práctica
    """
    session_id: str = Field(..., description="ID de la sesión")
    predictions: List[Dict[str, Any]] = Field(..., description="Lista de predicciones")
    target_letters: List[str] = Field(..., description="Letras objetivo")


class PracticeResultResponse(BaseModel):
    """
    Response con resultados de práctica
    """
    total_score: int = Field(..., description="Puntuación total")
    max_possible_score: int = Field(..., description="Puntuación máxima posible")
    accuracy: float = Field(..., description="Precisión en porcentaje")
    correct_predictions: int = Field(..., description="Predicciones correctas")
    total_predictions: int = Field(..., description="Total de predicciones")
    rating: str = Field(..., description="Calificación del desempeño")


class TutorialProgressRequest(BaseModel):
    """
    Request para actualizar progreso del tutorial
    """
    user_session: str = Field(..., description="ID de sesión del usuario")
    current_step: int = Field(..., description="Paso actual")
    is_completed: bool = Field(default=False, description="Si completó el paso")


class TutorialProgressResponse(BaseModel):
    """
    Response del progreso del tutorial
    """
    user_session: str = Field(..., description="ID de sesión del usuario")
    current_step: int = Field(..., description="Paso actual")
    total_steps: int = Field(..., description="Total de pasos")
    completed_steps: List[int] = Field(..., description="Pasos completados")
    is_completed: bool = Field(..., description="Si completó todo el tutorial")
    progress_percentage: float = Field(..., description="Progreso en porcentaje")


# Schemas para base de datos
class MLModelCreate(BaseModel):
    """
    Schema para crear modelo ML
    """
    name: str = Field(..., max_length=100)
    version: str = Field(..., max_length=20)
    file_path: str = Field(..., max_length=255)
    accuracy: Optional[float] = None
    confidence_threshold: float = Field(default=0.65)
    language: str = Field(default="EC", max_length=10)
    description: Optional[str] = None


class MLModelResponse(BaseModel):
    """
    Schema de respuesta para modelo ML
    """
    id: int
    name: str
    version: str
    file_path: str
    accuracy: Optional[float]
    confidence_threshold: float
    language: str
    is_active: bool
    description: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PredictionCreate(BaseModel):
    """
    Schema para crear predicción
    """
    model_id: int
    predicted_letter: str = Field(..., max_length=1)
    confidence: float
    processing_time_ms: float
    landmarks_data: Optional[str] = None
    user_session: Optional[str] = Field(None, max_length=100)


class PredictionDB(BaseModel):
    """
    Schema de predicción en base de datos
    """
    id: int
    model_id: int
    predicted_letter: str
    confidence: float
    processing_time_ms: float
    landmarks_data: Optional[str]
    user_session: Optional[str]
    is_correct: Optional[bool]
    created_at: datetime

    class Config:
        from_attributes = True
