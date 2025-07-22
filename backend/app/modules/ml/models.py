"""
Modelos de datos para el módulo ML
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class MLModel(Base):
    """
    Modelo para almacenar información de modelos ML
    """
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    version = Column(String(20), nullable=False)
    file_path = Column(String(255), nullable=False)
    accuracy = Column(Float, nullable=True)
    confidence_threshold = Column(Float, default=0.65)
    language = Column(String(10), default="EC")  # Ecuador
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Prediction(Base):
    """
    Modelo para almacenar predicciones del modelo
    """
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, nullable=False)
    predicted_letter = Column(String(1), nullable=False)
    confidence = Column(Float, nullable=False)
    processing_time_ms = Column(Float, nullable=False)
    landmarks_data = Column(Text, nullable=True)  # JSON string de landmarks
    user_session = Column(String(100), nullable=True)
    is_correct = Column(Boolean, nullable=True)  # Feedback del usuario
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PracticeSession(Base):
    """
    Modelo para sesiones de práctica
    """
    __tablename__ = "practice_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, unique=True, index=True)
    target_letters = Column(Text, nullable=False)  # JSON array de letras objetivo
    completed_letters = Column(Text, nullable=True)  # JSON array de letras completadas
    score = Column(Integer, default=0)
    max_score = Column(Integer, nullable=False)
    difficulty_level = Column(String(20), default="beginner")  # beginner, intermediate, advanced
    is_completed = Column(Boolean, default=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)


class Tutorial(Base):
    """
    Modelo para progreso del tutorial
    """
    __tablename__ = "tutorials"
    
    id = Column(Integer, primary_key=True, index=True)
    user_session = Column(String(100), nullable=False, index=True)
    current_step = Column(Integer, default=1)
    total_steps = Column(Integer, default=26)  # 24 letras del alfabeto ecuatoriano
    completed_steps = Column(Text, nullable=True)  # JSON array de pasos completados
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
