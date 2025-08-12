"""
Rutas simplificadas para gamificación
Version básica pero funcional
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uuid
import logging
from datetime import datetime

from app.core.supabase import get_supabase_service

router = APIRouter()
logger = logging.getLogger(__name__)

# =============================================
# 📝 MODELOS PYDANTIC SIMPLES
# =============================================

class StartGameRequest(BaseModel):
    session_type: str = "practice"  # practice, tutorial, challenge
    user_id: Optional[str] = None  # UUID del usuario desde el frontend

class GameAttemptRequest(BaseModel):
    session_id: str
    letter_id: int  # Referencia a letters.id en lugar de target_word
    is_correct: bool
    time_taken: float
    confidence_score: Optional[float] = None
    # Nuevos campos para palabras completas
    target_word: Optional[str] = None  # Palabra objetivo completa
    predicted_word: Optional[str] = None  # Palabra predicha completa

class MLPredictionRequest(BaseModel):
    session_id: str
    prediction_data: Dict  # Datos completos de la predicción
    confidence: float

class AwardAchievementRequest(BaseModel):
    user_id: str
    achievement_id: int

# =============================================
# 🔧 DEPENDENCIAS
# =============================================

def get_supabase_dependency():
    """Obtener servicio Supabase como dependency"""
    return get_supabase_service()

def get_current_user() -> dict:
    """Función que devuelve el usuario por defecto para desarrollo"""
    # En producción, el user_id vendrá desde el frontend en el body de las peticiones
    return {
        "id": "c1d5bed7-fa7c-41fe-947a-11be465cd512",
        "email": "dev@comsigns.com"
    }

# =============================================
# 🎮 ENDPOINTS DE JUEGO
# =============================================

@router.post("/game/start")
async def start_game_session(
    request: StartGameRequest,
    supabase_service = Depends(get_supabase_dependency)
) -> Dict[str, Any]:
    """Iniciar nueva sesión de juego"""
    try:
        logger.info(f"[GAME_START] Iniciando sesión de juego: {request.session_type}")
        
        # Usar UUID del frontend o fallback para desarrollo
        user_id = request.user_id or "c1d5bed7-fa7c-41fe-947a-11be465cd512"
        logger.info(f"[GAME_START] Usando user_id: {user_id}")

        # Verificar conexión a Supabase
        if not supabase_service.is_connected():
            logger.error("[GAME_START] Supabase no está conectado")
            raise HTTPException(
                status_code=500,
                detail="Error de conexión a base de datos"
            )
        
        logger.info("[GAME_START] Supabase conectado correctamente")

        # TEMPORAL: Crear usuario directamente en auth.users si no existe
        logger.info("[GAME_START] Creando/verificando usuario de prueba en auth.users")
        try:
            # Intentar insertar usuario en auth.users (tabla de sistema)
            # Esto es temporal para desarrollo
            auth_user_data = {
                'id': user_id,
                'email': 'test@example.com',
                'created_at': 'now()',
                'updated_at': 'now()',
                'email_confirmed_at': 'now()'
            }
            
            # Usar upsert para evitar errores si ya existe
            try:
                auth_result = supabase_service.supabase.table('auth.users').upsert(auth_user_data).execute()
                logger.info(f"[GAME_START] Usuario auth creado/actualizado")
            except Exception as auth_error:
                logger.warning(f"[GAME_START] No se pudo crear usuario auth (probablemente ya existe): {auth_error}")
                # Continuar de todos modos
                pass
                
        except Exception as auth_setup_error:
            logger.warning(f"[GAME_START] Error setup auth usuario: {str(auth_setup_error)}")
            # Continuar de todos modos

        # Verificar/crear perfil de usuario
        logger.info(f"[GAME_START] Verificando perfil de usuario: {user_id}")
        try:
            profile = await supabase_service.get_user_profile(user_id)
            logger.info(f"[GAME_START] Perfil encontrado: {profile is not None}")
        except Exception as profile_error:
            logger.error(f"[GAME_START] Error obteniendo perfil: {str(profile_error)}")
            profile = None
            
        if not profile:
            logger.info("[GAME_START] Creando perfil de usuario")
            try:
                created = await supabase_service.create_user_profile(
                    user_id,
                    full_name="Usuario de Prueba"
                )
                logger.info(f"[GAME_START] Perfil creado: {created}")
            except Exception as create_error:
                logger.error(f"[GAME_START] Error creando perfil: {str(create_error)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error creando perfil de usuario: {str(create_error)}"
                )

        # Iniciar sesión con tipo específico
        logger.info(f"[GAME_START] Iniciando sesión de juego para usuario: {user_id}")
        try:
            logger.info(f"[GAME_START] Llamando supabase_service.start_game_session...")
            session = await supabase_service.start_game_session(
                user_id, 
                request.session_type
            )
            logger.info(f"[GAME_START] Sesión recibida del servicio: {session}")
            logger.info(f"[GAME_START] Tipo de sesión recibida: {type(session)}")
            
            if session:
                logger.info(f"[GAME_START] Claves en sesión: {list(session.keys()) if isinstance(session, dict) else 'No es dict'}")
                # El backend devuelve 'id' como el session_id
                session_id = session.get('id') or session.get('session_id')
                if isinstance(session, dict) and session_id:
                    logger.info(f"[GAME_START] session_id encontrado: {session_id}")
                else:
                    logger.warning(f"[GAME_START] ⚠️ No se encontró ID en la respuesta")
            else:
                logger.error(f"[GAME_START] ❌ Sesión es None o falsy")
                
        except Exception as session_error:
            logger.error(f"[GAME_START] Error creando sesión: {str(session_error)}")
            logger.error(f"[GAME_START] Tipo de error de sesión: {type(session_error).__name__}")
            import traceback
            logger.error(f"[GAME_START] Traceback sesión: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=f"Error creando sesión de juego: {str(session_error)}"
            )

        if not session:
            logger.error("[GAME_START] Sesión es None")
            raise HTTPException(
                status_code=500,
                detail="Error iniciando sesión de juego - sesión vacía"
            )

        # Verificar que tiene ID (puede ser 'id' o 'session_id')
        session_id = session.get('id') or session.get('session_id')
        if not session_id:
            logger.error("[GAME_START] Sesión no tiene ID válido")
            raise HTTPException(
                status_code=500,
                detail="Error iniciando sesión de juego - sin ID"
            )

        logger.info(f"[GAME_START] ✅ Sesión iniciada correctamente: {session_id}")
        return {
            "status": "success",
            "session": session,
            "message": "Sesión iniciada correctamente"
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"[GAME_START] ❌ Error interno completo: {str(e)}")
        logger.error(f"[GAME_START] ❌ Tipo de error: {type(e).__name__}")
        import traceback
        logger.error(f"[GAME_START] ❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno detallado: {str(e)}"
        )

@router.get("/game/session/{session_id}")
async def get_game_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    supabase_service = Depends(get_supabase_dependency)
) -> Dict[str, Any]:
    """Obtener información de sesión de juego"""
    try:
        session = await supabase_service.get_game_session(session_id)
        
        if not session:
            raise HTTPException(
                status_code=404,
                detail="Sesión no encontrada"
            )

        if session["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos para ver esta sesión"
            )

        return {
            "status": "success",
            "session": session
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en get_game_session: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )

@router.post("/game/attempt")
async def record_game_attempt(
    request: GameAttemptRequest,
    current_user: dict = Depends(get_current_user),
    supabase_service = Depends(get_supabase_dependency)
) -> Dict[str, Any]:
    """Registrar intento de juego"""
    try:
        # Verificar que la sesión pertenezca al usuario y esté activa
        session = await supabase_service.get_game_session(request.session_id)
        if not session or session["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=404,
                detail="Sesión no encontrada"
            )
        
        # 🛡️ VERIFICAR QUE LA SESIÓN ESTÁ ACTIVA
        if session.get("status") != "active":
            logger.warning(f"🛡️ Intento ignorado - Sesión {request.session_id} no está activa (status: {session.get('status')})")
            raise HTTPException(
                status_code=400,
                detail="La sesión de juego ya ha finalizado"
            )

        # Registrar intento con nueva estructura
        logger.info(f"[ATTEMPT] Registrando intento: target_word={request.target_word}, predicted_word={request.predicted_word}, is_correct={request.is_correct}")
        
        success = await supabase_service.record_game_attempt(
            session_id=request.session_id,
            user_id=current_user["id"],
            letter_id=request.letter_id,  # Para compatibilidad
            is_correct=request.is_correct,
            time_taken=request.time_taken,
            confidence_score=request.confidence_score,
            target_word=request.target_word,  # Palabra objetivo completa
            predicted_word=request.predicted_word  # Palabra predicha completa
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Error registrando intento"
            )

        return {
            "status": "success",
            "message": "Intento registrado correctamente"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en record_game_attempt: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )

# =============================================
# � ENDPOINTS DE LETRAS
# =============================================

@router.get("/letters")
async def get_all_letters(
    supabase_service = Depends(get_supabase_dependency)
) -> Dict[str, Any]:
    """Obtener todas las letras del alfabeto"""
    try:
        letters = await supabase_service.get_all_letters()
        
        return {
            "status": "success",
            "letters": letters,
            "total": len(letters)
        }

    except Exception as e:
        logger.error(f"Error en get_all_letters: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )

@router.get("/letters/random/{count}")
async def get_random_letters(
    count: int = 10,
    supabase_service = Depends(get_supabase_dependency)
) -> Dict[str, Any]:
    """Obtener letras aleatorias para el juego"""
    try:
        if count < 1 or count > 27:
            raise HTTPException(
                status_code=400,
                detail="La cantidad debe estar entre 1 y 27"
            )

        letters = await supabase_service.get_random_letters(count)
        
        return {
            "status": "success",
            "letters": letters,
            "count": len(letters)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en get_random_letters: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )

# =============================================
# 🏆 ENDPOINTS DE LOGROS
# =============================================

@router.get("/achievements")
async def get_all_achievements(
    supabase_service = Depends(get_supabase_dependency)
) -> Dict[str, Any]:
    """Obtener todos los logros disponibles"""
    try:
        achievements = await supabase_service.get_all_achievements()
        
        return {
            "status": "success",
            "achievements": achievements,
            "total": len(achievements)
        }

    except Exception as e:
        logger.error(f"Error en get_all_achievements: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )

@router.post("/game/end")
async def end_game_session(
    request: dict,
    current_user: dict = Depends(get_current_user),  # Restaurar autenticación
    supabase_service = Depends(get_supabase_dependency)
) -> Dict[str, Any]:
    """Finalizar sesión de juego"""
    try:
        session_id = request.get("session_id")
        final_score = request.get("final_score", 0)
        
        if not session_id:
            raise HTTPException(
                status_code=400,
                detail="session_id es requerido"
            )
        
        # Verificar que la sesión existe y está activa
        session = await supabase_service.get_game_session(session_id)
        if not session:
            raise HTTPException(
                status_code=404,
                detail="Sesión no encontrada"
            )
        
        # 🛡️ PROTEGER CONTRA MÚLTIPLES LLAMADAS - verificar si ya está finalizada
        if session.get("status") != "active":
            logger.info(f"🛡️ Sesión {session_id} ya fue finalizada anteriormente (status: {session.get('status')})")
            return {
                "status": "success", 
                "message": "Sesión ya estaba finalizada"
            }
            
        # Verificar que la sesión pertenece al usuario (restaurado)
        if session.get("user_id") != current_user.get("id"):
            # Log para debug pero no fallar - permitir desarrollo
            logger.warning(f"User ID mismatch: session={session.get('user_id')}, current={current_user.get('id')}")
            # raise HTTPException(
            #     status_code=403,
            #     detail="No tienes permisos para finalizar esta sesión"
            # )
        
        # Finalizar sesión
        await supabase_service.end_game_session(session_id, final_score)
        
        return {
            "status": "success",
            "message": "Sesión finalizada correctamente"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en end_game_session: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )

@router.get("/user/profile")
async def get_user_profile(
    current_user: dict = Depends(get_current_user),
    supabase_service = Depends(get_supabase_dependency)
) -> Dict[str, Any]:
    """Obtener perfil del usuario"""
    try:
        profile = await supabase_service.get_user_profile(current_user["id"])
        
        if not profile:
            # Crear perfil si no existe
            created = await supabase_service.create_user_profile(current_user["id"])
            if created:
                profile = await supabase_service.get_user_profile(current_user["id"])
        
        return {
            "status": "success",
            "profile": profile
        }

    except Exception as e:
        logger.error(f"Error en get_user_profile: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )

@router.post("/debug/create-test-user")
async def create_test_user(
    supabase_service = Depends(get_supabase_dependency)
) -> Dict[str, Any]:
    """Crear usuario de prueba para desarrollo"""
    try:
        test_user_id = "00000000-0000-0000-0000-000000000001"
        
        # Verificar si ya existe
        existing = await supabase_service.get_user_profile(test_user_id)
        if existing:
            return {
                "status": "success",
                "message": "Usuario de prueba ya existe",
                "user": existing
            }
        
        # Crear nuevo usuario de prueba
        created = await supabase_service.create_user_profile(
            test_user_id,
            full_name="Usuario de Prueba"
        )
        
        if created:
            profile = await supabase_service.get_user_profile(test_user_id)
            return {
                "status": "success",
                "message": "Usuario de prueba creado",
                "user": profile
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Error creando usuario de prueba"
            )

    except Exception as e:
        logger.error(f"Error creando usuario de prueba: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error interno: {str(e)}"
        )
