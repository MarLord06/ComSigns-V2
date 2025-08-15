"""
Servicios del módulo ML - Lógica de negocio
"""

import os
import json
import time
import numpy as np
from typing import List, Optional, Dict, Any
from tensorflow.keras.models import load_model
import cv2
import mediapipe as mp

from app.core.config import settings
from app.core.exceptions import ModelError
from app.modules.ml.schemas import PredictionRequest, PredictionResponse


class MLService:
    """
    Servicio principal para Machine Learning
    """
    
    def __init__(self):
        self.model = None
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            max_num_hands=1, 
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Letras del alfabeto ecuatoriano (excluyendo J y Z)
        self.letters = [chr(i) for i in range(65, 91) if i not in (74, 90)]  # A-Y sin J y Z
        
        self._load_model()
    
    def _load_model(self):
        """
        Cargar modelo de TensorFlow
        """
        try:
            # 1. Intentar cargar el modelo entrenado v2 arreglado (máxima prioridad)
            model_path_v2_fixed = "/models/model.h5"
            if os.path.exists(model_path_v2_fixed):
                self.model = load_model(model_path_v2_fixed)
                print(f"✅ Modelo entrenado v2 arreglado cargado exitosamente desde: {model_path_v2_fixed}")
                return
            
            raise ModelError("No se encontró ningún modelo disponible")
            
        except Exception as e:
            # En desarrollo, permitir que la API funcione sin modelo
            if settings.is_development:
                print(f"⚠️  Modelo no disponible en desarrollo: {str(e)}")
                print("💡 Sugerencia: Verifica que model.h5 esté en /app/models/ podrias cambiar el nombre del modelo a model.h5 y arreglar para que cargue bien")
                self.model = None
            else:
                raise ModelError(f"Error cargando modelo: {str(e)}")
    
    def process_landmarks(self, image_data: bytes) -> Optional[np.ndarray]:
        """
        Procesar imagen y extraer landmarks de la mano
        """
        try:
            # Convertir bytes a imagen
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return None
            
            # Convertir BGR a RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Procesar con MediaPipe
            results = self.hands.process(rgb_image)
            
            if results.multi_hand_landmarks:
                # Obtener landmarks de la primera mano detectada
                hand_landmarks = results.multi_hand_landmarks[0]
                landmarks = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark])
                
                # Normalizar landmarks (relativo al primer punto)
                if landmarks.shape[0] == 21:  # 21 landmarks de la mano
                    landmarks = landmarks - landmarks[0]
                    return landmarks
            
            return None
            
        except Exception as e:
            raise ModelError(f"Error procesando landmarks: {str(e)}")
    
    def predict_letter(self, landmarks: np.ndarray) -> Dict[str, Any]:
        """
        Predecir letra basada en landmarks
        """
        try:
            start_time = time.time()
            
            if self.model is None:
                raise ModelError("Modelo no cargado")
            
            if landmarks.shape[0] != 21:
                raise ModelError(f"Se esperaban 21 landmarks, se recibieron {landmarks.shape[0]}")
            
            # Preparar features para el modelo
            features = landmarks.flatten()
            features = np.expand_dims(features, axis=0)
            
            # Hacer predicción
            prediction = self.model.predict(features, verbose=0)
            predicted_class = np.argmax(prediction, axis=1)[0]
            confidence = float(np.max(prediction))
            
            processing_time = (time.time() - start_time) * 1000  # en ms
            
            # Verificar umbral de confianza
            if confidence < settings.CONFIDENCE_THRESHOLD:
                return {
                    "letter": "",
                    "confidence": confidence,
                    "processing_time_ms": processing_time,
                    "status": "low_confidence"
                }
            
            # Verificar que la predicción esté en rango
            if predicted_class >= len(self.letters):
                return {
                    "letter": "",
                    "confidence": confidence,
                    "processing_time_ms": processing_time,
                    "status": "out_of_range"
                }
            
            predicted_letter = self.letters[predicted_class]
            
            return {
                "letter": predicted_letter,
                "confidence": confidence,
                "processing_time_ms": processing_time,
                "status": "success"
            }
            
        except Exception as e:
            raise ModelError(f"Error en predicción: {str(e)}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Obtener información del modelo
        """
        return {
            "model_loaded": self.model is not None,
            "supported_letters": self.letters,
            "total_letters": len(self.letters),
            "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
            "language": "Ecuatoriano",
            "version": "1.0"
        }


class TutorialService:
    """
    Servicio para el tutorial interactivo
    """
    
    def __init__(self):
        # Orden recomendado para aprender las letras (de más fácil a más difícil)
        self.learning_sequence = [
            "A", "B", "C", "D", "E", "F", "G", "H", "I", "K", 
            "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", 
            "V", "W", "X", "Y"
        ]
        
        # Información detallada de cada letra (fallback)
        self.fallback_letters_info = self._get_fallback_letters_info()
    
    def _get_fallback_letters_info(self) -> Dict[str, Dict[str, Any]]:
        """
        Información detallada de cada letra para el tutorial (datos de respaldo)
        """
        return {
            "A": {
                "name": "A",
                "description": "Puño cerrado con pulgar al lado",
                "difficulty": "easy",
                "tips": ["Mantén el puño bien cerrado", "El pulgar debe estar visible al lado"]
            },
            "B": {
                "name": "B", 
                "description": "Mano abierta, dedos juntos, pulgar doblado",
                "difficulty": "easy",
                "tips": ["Dedos bien rectos", "Pulgar pegado a la palma"]
            },
            "C": {
                "name": "C",
                "description": "Mano curvada como una C",
                "difficulty": "medium",
                "tips": ["Forma una C con toda la mano", "Mantén la curvatura uniforme"]
            },
            # Agregar más letras según sea necesario...
        }
    
    async def get_tutorial_step(self, step: int) -> Dict[str, Any]:
        """
        Obtener información del paso del tutorial desde Supabase o fallback
        """
        if step < 1 or step > len(self.learning_sequence):
            return {"error": "Paso inválido"}
        
        # Importar el servicio de Supabase aquí para evitar importación circular
        from app.core.supabase import get_supabase_service
        supabase_service = get_supabase_service()
        
        # Intentar obtener la lección desde Supabase
        lesson = await supabase_service.get_tutorial_lesson_by_number(step)
        
        if lesson:
            # Usar datos de Supabase
            return {
                "step": step,
                "total_steps": len(self.learning_sequence),
                "letter": lesson.get("letter", ""),
                "description": lesson.get("description", ""),
                "difficulty": lesson.get("difficulty", "medium"),
                "tips": lesson.get("tips", []),
                "progress": round((step / len(self.learning_sequence)) * 100, 1),
                "data_source": "supabase"
            }
        else:
            # Usar datos de respaldo
            letter = self.learning_sequence[step - 1]
            letter_info = self.fallback_letters_info.get(letter, {})
            
            return {
                "step": step,
                "total_steps": len(self.learning_sequence),
                "letter": letter,
                "description": letter_info.get("description", f"Aprende la seña de la letra {letter}"),
                "difficulty": letter_info.get("difficulty", "medium"),
                "tips": letter_info.get("tips", []),
                "progress": round((step / len(self.learning_sequence)) * 100, 1),
                "data_source": "fallback"
            }
    
    async def get_tutorial_overview(self) -> Dict[str, Any]:
        """
        Obtener resumen del tutorial desde Supabase o fallback
        """
        # Importar el servicio de Supabase aquí para evitar importación circular
        from app.core.supabase import get_supabase_service
        supabase_service = get_supabase_service()
        
        # Intentar obtener lecciones desde Supabase
        lessons = await supabase_service.get_tutorial_lessons()
        
        if lessons:
            # Usar datos de Supabase
            difficulty_counts = {"easy": 0, "medium": 0, "hard": 0}
            letters = []
            
            for lesson in lessons:
                difficulty = lesson.get("difficulty", "medium")
                if difficulty in difficulty_counts:
                    difficulty_counts[difficulty] += 1
                letters.append(lesson.get("letter", ""))
            
            return {
                "total_steps": len(lessons),
                "letters": letters,
                "estimated_time_minutes": len(lessons) * 3,  # 3 min por letra
                "difficulty_levels": difficulty_counts,
                "data_source": "supabase"
            }
        else:
            # Usar datos de respaldo
            return {
                "total_steps": len(self.learning_sequence),
                "letters": self.learning_sequence,
                "estimated_time_minutes": len(self.learning_sequence) * 3,  # 3 min por letra
                "difficulty_levels": {
                    "easy": sum(1 for letter in self.learning_sequence[:8]),
                    "medium": sum(1 for letter in self.learning_sequence[8:16]),
                    "hard": sum(1 for letter in self.learning_sequence[16:])
                },
                "data_source": "fallback"
            }


class PracticeService:
    """
    Servicio para el modo práctica
    """
    
    def __init__(self):
        self.difficulty_levels = {
            "beginner": {
                "letters": ["A", "B", "C", "D", "E", "F", "G", "H"],
                "time_limit": 10,  # segundos por letra
                "min_confidence": 0.7
            },
            "intermediate": {
                "letters": ["I", "K", "L", "M", "N", "O", "P", "Q"],
                "time_limit": 8,
                "min_confidence": 0.75
            },
            "advanced": {
                "letters": ["R", "S", "T", "U", "V", "W", "X", "Y"],
                "time_limit": 6,
                "min_confidence": 0.8
            }
        }
    
    def create_practice_session(self, difficulty: str = "beginner") -> Dict[str, Any]:
        """
        Crear nueva sesión de práctica
        """
        import uuid
        
        if difficulty not in self.difficulty_levels:
            difficulty = "beginner"
        
        config = self.difficulty_levels[difficulty]
        session_id = str(uuid.uuid4())
        
        return {
            "session_id": session_id,
            "difficulty": difficulty,
            "target_letters": config["letters"],
            "time_limit_per_letter": config["time_limit"],
            "min_confidence": config["min_confidence"],
            "total_letters": len(config["letters"]),
            "max_score": len(config["letters"]) * 100
        }
    
    def calculate_score(self, predictions: List[Dict], target_letters: List[str]) -> Dict[str, Any]:
        """
        Calcular puntuación de la sesión de práctica
        """
        total_score = 0
        correct_predictions = 0
        
        for i, prediction in enumerate(predictions):
            if i < len(target_letters):
                target = target_letters[i]
                predicted = prediction.get("letter", "")
                confidence = prediction.get("confidence", 0)
                
                if predicted == target:
                    correct_predictions += 1
                    # Puntuación basada en confianza
                    score = int(confidence * 100)
                    total_score += score
        
        accuracy = (correct_predictions / len(target_letters)) * 100 if target_letters else 0
        
        return {
            "total_score": total_score,
            "max_possible_score": len(target_letters) * 100,
            "accuracy": round(accuracy, 1),
            "correct_predictions": correct_predictions,
            "total_predictions": len(target_letters),
            "rating": self._get_rating(accuracy)
        }
    
    def _get_rating(self, accuracy: float) -> str:
        """
        Obtener calificación basada en precisión
        """
        if accuracy >= 90:
            return "¡Excelente! 🌟"
        elif accuracy >= 80:
            return "¡Muy bien! 👍"
        elif accuracy >= 70:
            return "Bien 👌"
        elif accuracy >= 60:
            return "Regular 🤔"
        else:
            return "Sigue practicando 💪"


# Instancias globales de servicios
ml_service = MLService()
tutorial_service = TutorialService()
practice_service = PracticeService()