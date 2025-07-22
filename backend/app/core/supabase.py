"""
Servicio de Supabase para COMSIGNS
"""

import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from supabase import create_client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class SupabaseService:
    """
    Servicio para manejar todas las operaciones con Supabase
    """
    
    def __init__(self):
        self.supabase = None
        self._initialize_client()
    
    def _initialize_client(self):
        """
        Inicializar cliente de Supabase
        """
        try:
            if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
                self.supabase = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_ANON_KEY
                )
                logger.info("✅ Cliente de Supabase inicializado correctamente")
            else:
                logger.warning("⚠️ Configuración de Supabase no encontrada - funcionando en modo local")
        except Exception as e:
            logger.error(f"❌ Error inicializando Supabase: {str(e)}")
            self.supabase = None
    
    def is_connected(self) -> bool:
        """
        Verificar si Supabase está conectado
        """
        return self.supabase is not None
    
    # Gestión de Usuarios y Sesiones
    async def create_user_session(self, session_data: Dict[str, Any]) -> Optional[str]:
        """
        Crear una nueva sesión de usuario
        """
        if not self.is_connected():
            logger.warning("Supabase no conectado - sesión no guardada")
            return None
            
        try:
            session_record = {
                "session_id": session_data.get("session_id"),
                "user_agent": session_data.get("user_agent"),
                "ip_address": session_data.get("ip_address"),
                "started_at": datetime.utcnow().isoformat(),
                "is_active": True
            }
            
            result = self.supabase.table("user_sessions").insert(session_record).execute()
            
            if result.data:
                logger.info(f"✅ Sesión de usuario creada: {session_data.get('session_id')}")
                return result.data[0]["id"]
            
        except Exception as e:
            logger.error(f"❌ Error creando sesión de usuario: {str(e)}")
            
        return None
    
    # Gestión de Predicciones ML
    async def save_prediction(self, prediction_data: Dict[str, Any]) -> Optional[str]:
        """
        Guardar predicción ML en Supabase
        """
        if not self.is_connected():
            logger.warning("Supabase no conectado - predicción no guardada")
            return None
            
        try:
            prediction_record = {
                "session_id": prediction_data.get("session_id"),
                "predicted_letter": prediction_data.get("predicted_letter"),
                "confidence": prediction_data.get("confidence"),
                "processing_time_ms": prediction_data.get("processing_time_ms"),
                "landmarks_data": json.dumps(prediction_data.get("landmarks_data", [])),
                "model_version": prediction_data.get("model_version", "1.0"),
                "status": prediction_data.get("status", "success"),
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("ml_predictions").insert(prediction_record).execute()
            
            if result.data:
                logger.info(f"✅ Predicción guardada: {prediction_data.get('predicted_letter')} (conf: {prediction_data.get('confidence')})")
                return result.data[0]["id"]
                
        except Exception as e:
            logger.error(f"❌ Error guardando predicción: {str(e)}")
            
        return None
    
    # Gestión del Tutorial
    async def save_tutorial_progress(self, progress_data: Dict[str, Any]) -> Optional[str]:
        """
        Guardar progreso del tutorial
        """
        if not self.is_connected():
            logger.warning("Supabase no conectado - progreso del tutorial no guardado")
            return None
            
        try:
            progress_record = {
                "session_id": progress_data.get("session_id"),
                "letter": progress_data.get("letter"),
                "step_number": progress_data.get("step_number"),
                "is_completed": progress_data.get("is_completed", False),
                "attempts": progress_data.get("attempts", 1),
                "time_spent_seconds": progress_data.get("time_spent_seconds", 0),
                "completed_at": datetime.utcnow().isoformat() if progress_data.get("is_completed") else None
            }
            
            result = self.supabase.table("tutorial_progress").insert(progress_record).execute()
            
            if result.data:
                logger.info(f"✅ Progreso tutorial guardado: {progress_data.get('letter')} - Step {progress_data.get('step_number')}")
                return result.data[0]["id"]
                
        except Exception as e:
            logger.error(f"❌ Error guardando progreso tutorial: {str(e)}")
            
        return None
    
    # Gestión del Modo Práctica
    async def save_practice_session(self, session_data: Dict[str, Any]) -> Optional[str]:
        """
        Guardar sesión de práctica
        """
        if not self.is_connected():
            logger.warning("Supabase no conectado - sesión de práctica no guardada")
            return None
            
        try:
            practice_record = {
                "session_id": session_data.get("session_id"),
                "difficulty": session_data.get("difficulty"),
                "target_letters": json.dumps(session_data.get("target_letters", [])),
                "total_exercises": session_data.get("total_exercises", 0),
                "started_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("practice_sessions").insert(practice_record).execute()
            
            if result.data:
                logger.info(f"✅ Sesión de práctica creada: {session_data.get('difficulty')}")
                return result.data[0]["id"]
                
        except Exception as e:
            logger.error(f"❌ Error guardando sesión de práctica: {str(e)}")
            
        return None
    
    async def save_practice_result(self, result_data: Dict[str, Any]) -> Optional[str]:
        """
        Guardar resultados de práctica
        """
        if not self.is_connected():
            logger.warning("Supabase no conectado - resultado de práctica no guardado")
            return None
            
        try:
            result_record = {
                "session_id": result_data.get("session_id"),
                "practice_session_id": result_data.get("practice_session_id"),
                "score": result_data.get("score", 0),
                "accuracy": result_data.get("accuracy", 0.0),
                "total_time_seconds": result_data.get("total_time_seconds", 0),
                "correct_predictions": result_data.get("correct_predictions", 0),
                "total_predictions": result_data.get("total_predictions", 0),
                "detailed_results": json.dumps(result_data.get("detailed_results", [])),
                "completed_at": datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table("practice_results").insert(result_record).execute()
            
            if result.data:
                logger.info(f"✅ Resultado de práctica guardado: Score {result_data.get('score')} - Accuracy {result_data.get('accuracy')}%")
                return result.data[0]["id"]
                
        except Exception as e:
            logger.error(f"❌ Error guardando resultado de práctica: {str(e)}")
            
        return None
    
    # Consultas y Estadísticas
    async def get_user_statistics(self, session_id: str) -> Dict[str, Any]:
        """
        Obtener estadísticas del usuario
        """
        if not self.is_connected():
            return {"error": "Supabase no conectado"}
            
        try:
            # Estadísticas de predicciones
            predictions = self.supabase.table("ml_predictions").select("*").eq("session_id", session_id).execute()
            
            # Progreso del tutorial
            tutorial_progress = self.supabase.table("tutorial_progress").select("*").eq("session_id", session_id).execute()
            
            # Resultados de práctica
            practice_results = self.supabase.table("practice_results").select("*").eq("session_id", session_id).execute()
            
            stats = {
                "total_predictions": len(predictions.data) if predictions.data else 0,
                "tutorial_progress": len(tutorial_progress.data) if tutorial_progress.data else 0,
                "practice_sessions": len(practice_results.data) if practice_results.data else 0,
                "average_accuracy": 0.0,
                "most_predicted_letters": []
            }
            
            # Calcular accuracy promedio
            if predictions.data:
                total_confidence = sum(p.get("confidence", 0) for p in predictions.data)
                stats["average_accuracy"] = round(total_confidence / len(predictions.data) * 100, 2)
                
                # Letras más predichas
                letter_counts = {}
                for p in predictions.data:
                    letter = p.get("predicted_letter", "")
                    letter_counts[letter] = letter_counts.get(letter, 0) + 1
                
                stats["most_predicted_letters"] = sorted(letter_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            return stats
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo estadísticas: {str(e)}")
            return {"error": str(e)}
    
    async def get_leaderboard(self, difficulty: str = "beginner", limit: int = 10) -> List[Dict[str, Any]]:
        """
        Obtener tabla de clasificación
        """
        if not self.is_connected():
            return []
            
        try:
            result = (self.supabase
                     .table("practice_results")
                     .select("session_id, score, accuracy, completed_at")
                     .order("score", desc=True)
                     .limit(limit)
                     .execute())
            
            leaderboard = []
            for i, record in enumerate(result.data or [], 1):
                leaderboard.append({
                    "rank": i,
                    "session_id": record.get("session_id", f"Usuario{i}"),
                    "score": record.get("score", 0),
                    "accuracy": round(record.get("accuracy", 0), 1),
                    "completed_at": record.get("completed_at")
                })
            
            return leaderboard
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo leaderboard: {str(e)}")
            return []

# Instancia global del servicio
supabase_service = SupabaseService()
