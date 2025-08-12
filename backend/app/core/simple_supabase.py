"""
Servicio Supabase simplificado para gamificación
Version básica pero funcional
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class SimpleSupabaseService:
    def __init__(self, url: str, key: str):
        self.supabase: Client = create_client(url, key)
        self._connected = False
        self._test_connection()

    def _test_connection(self):
        """Probar conexión a Supabase"""
        try:
            result = self.supabase.table('user_profiles').select('id').limit(1).execute()
            self._connected = True
            logger.info("Conexión a Supabase establecida correctamente")
        except Exception as e:
            logger.error(f"Error conectando a Supabase: {str(e)}")
            self._connected = False

    def is_connected(self) -> bool:
        return self._connected

    # ==============================================
    # 👤 GESTIÓN DE USUARIOS
    # ==============================================

    async def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Obtener perfil de usuario (basado en auth.users)"""
        if not self.is_connected():
            return None

        try:
            result = self.supabase.table('user_profiles') \
                .select('*') \
                .eq('id', user_id) \
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error obteniendo perfil de usuario: {str(e)}")
            return None

    async def create_user_profile(self, user_id: str, full_name: str = None) -> bool:
        """Crear perfil de usuario (el ID debe existir en auth.users)"""
        if not self.is_connected():
            return False

        try:
            profile_data = {
                'id': user_id,  # Este ID debe existir en auth.users
                'full_name': full_name or 'Usuario'
            }

            result = self.supabase.table('user_profiles') \
                .insert(profile_data) \
                .execute()
            
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error creando perfil de usuario: {str(e)}")
            return False

    async def update_user_stats(self, user_id: str, session_stats: Dict) -> bool:
        """Actualizar estadísticas del usuario después de una partida"""
        if not self.is_connected():
            return False

        try:
            # Obtener perfil actual
            current_profile = await self.get_user_profile(user_id)
            if not current_profile:
                logger.error(f"No se pudo obtener perfil para actualizar stats: {user_id}")
                return False
            
            # Extraer estadísticas de la sesión
            session_score = session_stats.get('total_score', 0)
            total_attempts = session_stats.get('total_attempts', 0)
            correct_attempts = session_stats.get('correct_attempts', 0)
            session_completed = session_stats.get('completed', False)
            
            # Calcular nuevas estadísticas
            new_games_played = (current_profile.get('games_played', 0) + 1) if session_completed else current_profile.get('games_played', 0)
            new_total_points = current_profile.get('total_points', 0) + session_score
            
            # Calcular precisión si hay intentos
            if total_attempts > 0:
                session_accuracy = (correct_attempts / total_attempts) * 100
                current_accuracy = current_profile.get('accuracy_percentage', 0.0) or 0.0
                current_games = current_profile.get('games_played', 0)
                
                # Promedio ponderado de precisión
                if current_games > 0:
                    new_accuracy = ((current_accuracy * current_games) + session_accuracy) / (current_games + 1)
                else:
                    new_accuracy = session_accuracy
            else:
                new_accuracy = current_profile.get('accuracy_percentage', 0.0)
            
            # Actualizar racha (simplificado: +1 si completó la partida, reset si no)
            if session_completed and session_score > 0:
                new_current_streak = current_profile.get('current_streak', 0) + 1
                new_longest_streak = max(current_profile.get('longest_streak', 0), new_current_streak)
            else:
                new_current_streak = 0
                new_longest_streak = current_profile.get('longest_streak', 0)
            
            # Actualizar progreso de nivel si completó la partida exitosamente
            current_level = current_profile.get('current_level', 1)
            if session_completed and session_score > 0:
                # Determinar si debe subir de nivel basándose en ciertos criterios
                # Por ejemplo: precisión > 70% y puntuación > threshold
                level_completed = False
                if new_accuracy >= 70.0 and session_score >= 50:  # Criterios de ejemplo
                    level_completed = True
                    logger.info(f"[UPDATE_STATS] ¡Nivel completado! Accuracy: {new_accuracy:.1f}%, Score: {session_score}")
                
                # Solo subir de nivel si no está ya en el máximo
                if level_completed and current_level < 3:  # 3 niveles máximos por ahora
                    new_current_level = current_level + 1
                    logger.info(f"[UPDATE_STATS] 🎉 ¡Usuario subió de nivel {current_level} → {new_current_level}!")
                else:
                    new_current_level = current_level
            else:
                new_current_level = current_level
            
            # Preparar actualización
            updates = {
                'total_points': new_total_points,
                'games_played': new_games_played,
                'accuracy_percentage': round(new_accuracy, 2),
                'current_streak': new_current_streak,
                'longest_streak': new_longest_streak,
                'current_level': new_current_level,
                'updated_at': datetime.now().isoformat()
            }
            
            logger.info(f"[UPDATE_STATS] Actualizando stats para {user_id}: {updates}")
            
            # Actualizar perfil
            result = self.supabase.table('user_profiles') \
                .update(updates) \
                .eq('id', user_id) \
                .execute()
            
            success = len(result.data) > 0
            if success:
                logger.info(f"[UPDATE_STATS] ✅ Estadísticas actualizadas para {user_id}")
            else:
                logger.error(f"[UPDATE_STATS] ❌ No se pudieron actualizar las estadísticas para {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error actualizando estadísticas de usuario: {str(e)}")
            return False

    # ==============================================
    # 🎮 SESIONES DE JUEGO
    # ==============================================

    async def start_game_session(self, user_id: str = None, session_type: str = 'practice') -> Optional[Dict]:
        """Iniciar nueva sesión de juego"""
        logger.info(f"[SERVICE] start_game_session llamado con user_id={user_id}, session_type={session_type}")
        
        if not self.is_connected():
            logger.error(f"[SERVICE] Supabase no está conectado")
            return None

        try:
            # Usar usuario de prueba por defecto si no se especifica
            if not user_id:
                user_id = '00000000-0000-0000-0000-000000000001'
                logger.info(f"[SERVICE] Usando user_id por defecto: {user_id}")
                
            logger.info(f"[SERVICE] Preparando datos de sesión para user_id: {user_id}")
            session_data = {
                'user_id': user_id,  # Requerido por schema
                'level': 1,  
                'total_score': 0,  
                'lives_remaining': 5,
                'status': 'active'
            }
            logger.info(f"[SERVICE] Datos de sesión: {session_data}")

            logger.info(f"[SERVICE] Insertando en tabla game_sessions...")
            result = self.supabase.table('game_sessions') \
                .insert(session_data) \
                .execute()
            
            logger.info(f"[SERVICE] Resultado de inserción: {result}")
            logger.info(f"[SERVICE] Datos devueltos: {result.data}")
            logger.info(f"[SERVICE] Longitud de datos: {len(result.data) if result.data else 0}")
            
            if result.data:
                session = result.data[0]
                logger.info(f"[SERVICE] Primera sesión: {session}")
                logger.info(f"[SERVICE] Tipo de primera sesión: {type(session)}")
                
                # Si no tiene session_id, obtenerlo con una query separada
                if 'session_id' not in session or not session['session_id']:
                    logger.info(f"[SERVICE] session_id no está en el resultado, buscando por user_id...")
                    # Buscar la sesión más reciente del usuario
                    recent_session_result = self.supabase.table('game_sessions') \
                        .select('*') \
                        .eq('user_id', user_id) \
                        .eq('status', 'active') \
                        .order('created_at', desc=True) \
                        .limit(1) \
                        .execute()
                    
                    logger.info(f"[SERVICE] Sesión reciente encontrada: {recent_session_result.data}")
                    if recent_session_result.data:
                        session = recent_session_result.data[0]
                        logger.info(f"[SERVICE] Sesión con session_id: {session}")
                
                return session
            else:
                logger.error(f"[SERVICE] ❌ No se recibieron datos de la inserción")
                return None
                
        except Exception as e:
            logger.error(f"[SERVICE] ❌ Error iniciando sesión de juego: {str(e)}")
            logger.error(f"[SERVICE] ❌ Tipo de error: {type(e).__name__}")
            import traceback
            logger.error(f"[SERVICE] ❌ Traceback: {traceback.format_exc()}")
            return None

    async def get_game_session(self, session_id: str) -> Optional[Dict]:
        """Obtener sesión de juego"""
        if not self.is_connected():
            return None

        try:
            result = self.supabase.table('game_sessions') \
                .select('*') \
                .eq('id', session_id) \
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error obteniendo sesión de juego: {str(e)}")
            return None

    async def update_game_session(self, session_id: str, updates: Dict) -> bool:
        """Actualizar sesión de juego"""
        if not self.is_connected():
            return False

        try:
            result = self.supabase.table('game_sessions') \
                .update(updates) \
                .eq('id', session_id) \
                .execute()
            
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error actualizando sesión de juego: {str(e)}")
            return False

    async def end_game_session(self, session_id: str, final_score: int = None, status: str = 'completed') -> bool:
        """Finalizar sesión de juego y actualizar estadísticas del usuario"""
        if not self.is_connected():
            return False

        try:
            # Primero obtener la sesión actual para obtener user_id
            session = await self.get_game_session(session_id)
            if not session:
                logger.error(f"No se pudo obtener sesión {session_id} para finalizar")
                return False
            
            user_id = session.get('user_id')
            if not user_id:
                logger.error(f"Sesión {session_id} no tiene user_id")
                return False
            
            # Actualizar la sesión
            updates = {
                'status': status,
                'ended_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            if final_score is not None:
                updates['total_score'] = final_score

            result = self.supabase.table('game_sessions') \
                .update(updates) \
                .eq('id', session_id) \
                .execute()
            
            session_updated = len(result.data) > 0
            if not session_updated:
                logger.error(f"No se pudo actualizar sesión {session_id}")
                return False
            
            # Obtener estadísticas de los intentos de esta sesión para calcular precisión
            try:
                attempts_result = self.supabase.table('game_attempts') \
                    .select('is_correct') \
                    .eq('session_id', session_id) \
                    .execute()
                
                total_attempts = len(attempts_result.data) if attempts_result.data else 0
                correct_attempts = sum(1 for attempt in attempts_result.data if attempt.get('is_correct', False)) if attempts_result.data else 0
                
                logger.info(f"[END_SESSION] Sesión {session_id}: {correct_attempts}/{total_attempts} intentos correctos")
                
            except Exception as attempts_error:
                logger.warning(f"No se pudieron obtener intentos para estadísticas: {attempts_error}")
                total_attempts = 0
                correct_attempts = 0
            
            # Actualizar estadísticas del usuario
            session_stats = {
                'total_score': final_score or 0,
                'total_attempts': total_attempts,
                'correct_attempts': correct_attempts,
                'completed': status == 'completed'
            }
            
            stats_updated = await self.update_user_stats(user_id, session_stats)
            
            if stats_updated:
                logger.info(f"[END_SESSION] ✅ Sesión {session_id} finalizada y estadísticas actualizadas")
            else:
                logger.warning(f"[END_SESSION] ⚠️ Sesión {session_id} finalizada pero estadísticas no actualizadas")
            
            return True  # Consideramos éxito si al menos la sesión se actualizó
            
        except Exception as e:
            logger.error(f"Error finalizando sesión de juego: {str(e)}")
            return False

    # ===============================================
    # 🎯 INTENTOS DE JUEGO
    # ==============================================

    async def record_game_attempt(self, session_id: str, user_id: str, 
                                 letter_id: int,  # Lo convertiremos a letter
                                 is_correct: bool, time_taken: float,
                                 confidence_score: float = None) -> bool:
        """Registrar intento de juego (adaptado para schema simple)"""
        if not self.is_connected():
            return False

        try:
            # Convertir letter_id a letra actual
            letter_data = await self.get_letter(letter_id)
            target_letter = letter_data['letter'] if letter_data else 'A'
            
            points = 10 if is_correct else 0  # Puntos simples
            
            attempt_data = {
                'game_session_id': session_id,  
                'user_id': user_id,  
                'target_word': target_letter,  # Usar target_word como requiere el schema
                'word_index': 0,  # Por ahora usar índice fijo
                'is_correct': is_correct,
                'time_taken_seconds': time_taken,
                'points_earned': points,
                'confidence_score': confidence_score
            }

            result = self.supabase.table('game_attempts') \
                .insert(attempt_data) \
                .execute()
            
            # Actualizar estadísticas del usuario
            if len(result.data) > 0:
                await self._update_user_stats(user_id, points, is_correct)
                # Verificar y otorgar logros automáticamente
                await self._check_and_award_achievements(user_id, points, is_correct)
            
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error registrando intento de juego: {str(e)}")
            return False

    async def _update_user_stats(self, user_id: str, points: int, is_correct: bool):
        """Actualizar estadísticas básicas del usuario"""
        try:
            # Obtener stats actuales
            profile = await self.get_user_profile(user_id)
            if not profile:
                return

            # Calcular nuevas stats básicas
            new_points = profile['total_points'] + points
            new_games = profile['games_played'] + 1
            
            # Calcular nueva precisión (simplificado)
            if is_correct:
                new_accuracy = ((profile['accuracy_percentage'] * (new_games - 1)) + 100) / new_games
            else:
                new_accuracy = (profile['accuracy_percentage'] * (new_games - 1)) / new_games

            # Manejar racha actual
            if is_correct:
                new_current_streak = profile.get('current_streak', 0) + 1
                new_longest_streak = max(profile.get('longest_streak', 0), new_current_streak)
            else:
                new_current_streak = 0
                new_longest_streak = profile.get('longest_streak', 0)

            # Calcular nuevo nivel (cada 100 puntos = 1 nivel)
            new_level = max(1, (new_points // 100) + 1)

            updates = {
                'total_points': new_points,
                'games_played': new_games,
                'accuracy_percentage': round(new_accuracy, 2),
                'current_streak': new_current_streak,
                'longest_streak': new_longest_streak,
                'current_level': new_level,
                'updated_at': datetime.now().isoformat()
            }

            self.supabase.table('user_profiles') \
                .update(updates) \
                .eq('id', user_id) \
                .execute()

        except Exception as e:
            logger.error(f"Error actualizando estadísticas de usuario: {str(e)}")

    async def _check_and_award_achievements(self, user_id: str, points_earned: int, is_correct: bool):
        """Verificar y otorgar logros automáticamente basados en progreso"""
        try:
            profile = await self.get_user_profile(user_id)
            if not profile:
                return

            # Obtener logros ya obtenidos
            user_achievements = await self.get_user_achievements(user_id)
            achieved_ids = {ach.get('achievement_id') for ach in user_achievements}

            # Logros basados en puntos
            if profile['total_points'] >= 100 and 1 not in achieved_ids:
                await self.award_achievement(user_id, 1)  # "Primeros 100 puntos"
            
            if profile['total_points'] >= 500 and 2 not in achieved_ids:
                await self.award_achievement(user_id, 2)  # "500 puntos"
            
            if profile['total_points'] >= 1000 and 3 not in achieved_ids:
                await self.award_achievement(user_id, 3)  # "1000 puntos"

            # Logros basados en rachas
            if profile.get('current_streak', 0) >= 5 and 4 not in achieved_ids:
                await self.award_achievement(user_id, 4)  # "Racha de 5"
            
            if profile.get('longest_streak', 0) >= 10 and 5 not in achieved_ids:
                await self.award_achievement(user_id, 5)  # "Racha de 10"

            # Logros basados en precisión
            if profile['accuracy_percentage'] >= 90.0 and profile['games_played'] >= 10 and 6 not in achieved_ids:
                await self.award_achievement(user_id, 6)  # "Precisión 90%"

            # Logros basados en juegos jugados
            if profile['games_played'] >= 50 and 7 not in achieved_ids:
                await self.award_achievement(user_id, 7)  # "50 juegos"

        except Exception as e:
            logger.error(f"Error verificando logros: {str(e)}")

    # ===============================================
    # 🔮 PREDICCIONES ML
    # ==============================================

    async def record_ml_prediction(self, user_id: str, session_id: str,
                                  target_letter: str, predicted_letter: str,
                                  confidence: float) -> bool:
        """Registrar predicción del modelo ML"""
        if not self.is_connected():
            return False

        try:
            prediction_data = {
                'user_id': user_id,
                'session_id': session_id,
                'target_letter': target_letter,
                'predicted_letter': predicted_letter,
                'confidence': confidence,
                'is_correct': target_letter.upper() == predicted_letter.upper()
            }

            result = self.supabase.table('ml_predictions') \
                .insert(prediction_data) \
                .execute()
            
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error registrando predicción ML: {str(e)}")
            return False

    # ==============================================
    # 🏆 LOGROS
    # ==============================================

    async def get_user_achievements(self, user_id: str) -> List[Dict]:
        """Obtener logros del usuario"""
        if not self.is_connected():
            return []

        try:
            result = self.supabase.table('user_achievements') \
                .select('*, achievements(*)') \
                .eq('user_id', user_id) \
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"Error obteniendo logros de usuario: {str(e)}")
            return []

    async def award_achievement(self, user_id: str, achievement_id: int) -> bool:
        """Otorgar logro a usuario"""
        if not self.is_connected():
            return False

        try:
            # Verificar si ya lo tiene
            existing = self.supabase.table('user_achievements') \
                .select('id') \
                .eq('user_id', user_id) \
                .eq('achievement_id', achievement_id) \
                .execute()

            if existing.data:
                return True  # Ya lo tiene

            # Otorgar logro
            result = self.supabase.table('user_achievements') \
                .insert({
                    'user_id': user_id,
                    'achievement_id': achievement_id
                }) \
                .execute()
            
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error otorgando logro: {str(e)}")
            return False

    # ==============================================
    # 📊 ESTADÍSTICAS Y LEADERBOARD
    # ==============================================

    async def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        """Obtener leaderboard básico"""
        if not self.is_connected():
            return []

        try:
            result = self.supabase.table('user_profiles') \
                .select('username, total_points, current_level, accuracy_percentage') \
                .eq('is_active', True) \
                .order('total_points', desc=True) \
                .limit(limit) \
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"Error obteniendo leaderboard: {str(e)}")
            return []

    async def get_user_session_history(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Obtener historial de sesiones del usuario"""
        if not self.is_connected():
            return []

        try:
            result = self.supabase.table('game_sessions') \
                .select('*') \
                .eq('user_id', user_id) \
                .order('started_at', desc=True) \
                .limit(limit) \
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"Error obteniendo historial de sesiones: {str(e)}")
            return []

    # ==============================================
    # 🔤 LETRAS Y ALFABETO
    # ==============================================

    async def get_all_letters(self) -> List[Dict]:
        """Obtener todas las letras del alfabeto"""
        if not self.is_connected():
            return []

        try:
            result = self.supabase.table('letters') \
                .select('*') \
                .order('id') \
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"Error obteniendo letras: {str(e)}")
            return []

    async def get_letter(self, letter_id: int) -> Optional[Dict]:
        """Obtener información de una letra específica"""
        if not self.is_connected():
            return None

        try:
            result = self.supabase.table('letters') \
                .select('*') \
                .eq('id', letter_id) \
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error obteniendo letra: {str(e)}")
            return None

    async def get_random_letters(self, count: int = 10) -> List[Dict]:
        """Obtener letras aleatorias para juego"""
        if not self.is_connected():
            return []

        try:
            # En PostgreSQL/Supabase podemos usar rpc() o hacer query simple y mezclar en Python
            result = self.supabase.table('letters') \
                .select('*') \
                .execute()
            
            if result.data:
                import random
                letters = result.data
                return random.sample(letters, min(count, len(letters)))
            
            return []
        except Exception as e:
            logger.error(f"Error obteniendo letras aleatorias: {str(e)}")
            return []

    # ==============================================
    # 🏆 LOGROS Y GAMIFICACIÓN
    # ==============================================

    async def get_all_achievements(self) -> List[Dict]:
        """Obtener todos los logros disponibles"""
        if not self.is_connected():
            return []

        try:
            result = self.supabase.table('achievements') \
                .select('*') \
                .order('id') \
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"Error obteniendo logros: {str(e)}")
            return []

    async def get_user_achievements(self, user_id: str) -> List[Dict]:
        """Obtener logros del usuario con información del logro"""
        if not self.is_connected():
            return []

        try:
            result = self.supabase.table('user_achievements') \
                .select('''
                    *,
                    achievements(*)
                ''') \
                .eq('user_id', user_id) \
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"Error obteniendo logros del usuario: {str(e)}")
            return []

    async def award_achievement(self, user_id: str, achievement_id: int) -> bool:
        """Otorgar logro a usuario"""
        if not self.is_connected():
            return False

        try:
            # Verificar si ya tiene el logro
            existing = self.supabase.table('user_achievements') \
                .select('id') \
                .eq('user_id', user_id) \
                .eq('achievement_id', achievement_id) \
                .execute()
            
            if existing.data:
                return True  # Ya tiene el logro
            
            # Otorgar el logro
            result = self.supabase.table('user_achievements') \
                .insert({
                    'user_id': user_id,
                    'achievement_id': achievement_id
                }) \
                .execute()
            
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error otorgando logro: {str(e)}")
            return False

    # ==============================================
    # 📚 PREDICCIONES ML
    # ==============================================

    async def create_user_session(self, session_data: Dict) -> bool:
        """Crear sesión de usuario para WebSocket"""
        if not self.is_connected():
            return False

        try:
            # Por ahora solo registramos en logs, no guardamos en BD
            logger.info(f"Session creada: {session_data.get('session_id')}")
            return True
        except Exception as e:
            logger.error(f"Error creando sesión de usuario: {str(e)}")
            return False

    async def save_prediction(self, prediction_data: Dict) -> bool:
        """Método de compatibilidad - redirige a save_ml_prediction"""
        return await self.save_ml_prediction(
            session_id=prediction_data.get('session_id'),
            user_id=prediction_data.get('user_id'),
            prediction_data=prediction_data,
            confidence=prediction_data.get('confidence', 0.0)
        )

    async def save_ml_prediction(self, session_id: str, user_id: str, 
                                prediction_data: Dict, confidence: float) -> bool:
        """Guardar predicción del modelo ML"""
        if not self.is_connected():
            return False

        try:
            # Extraer la letra predecida del prediction_data
            predicted_letter = prediction_data.get('letter', '?')
            target_letter = prediction_data.get('target_letter', '?')
            
            prediction = {
                'game_session_id': session_id,
                'user_id': user_id,
                'target_letter': target_letter,
                'predicted_letter': predicted_letter,
                'confidence': confidence,  # USAR 'confidence' NO 'confidence_score'
                'is_correct': predicted_letter == target_letter
            }

            result = self.supabase.table('ml_predictions') \
                .insert(prediction) \
                .execute()
            
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error guardando predicción ML: {str(e)}")
            return False

# Instancia global del servicio
simple_supabase_service = None

def get_simple_supabase_service() -> SimpleSupabaseService:
    """Obtener instancia del servicio"""
    global simple_supabase_service
    if simple_supabase_service is None:
        # Obtener credenciales desde config
        from .config import get_settings
        settings = get_settings()
        simple_supabase_service = SimpleSupabaseService(
            url=settings.SUPABASE_URL,
            key=settings.SUPABASE_ANON_KEY
        )
    return simple_supabase_service
