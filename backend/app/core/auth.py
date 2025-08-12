"""
Utilidades de autenticación JWT para Supabase
"""

import logging
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Security scheme para extraer el Bearer token
security = HTTPBearer()

settings = get_settings()

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Extraer y validar el JWT token de Supabase para obtener el usuario actual
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Extraer el token del header Authorization
        token = credentials.credentials
        
        if not token:
            logger.warning("No token provided")
            raise credentials_exception
        
        # Verificar el token JWT (sin validar la firma por ahora, ya que Supabase lo maneja)
        # En producción deberías validar con la clave pública de Supabase
        try:
            # Decodificar sin verificar la firma (solo para desarrollo)
            # En producción usar la clave pública de Supabase
            payload = jwt.decode(
                token, 
                options={"verify_signature": False, "verify_exp": True}
            )
            
            user_id: str = payload.get("sub")
            email: str = payload.get("email")
            
            if user_id is None:
                logger.warning("Token does not contain user ID")
                raise credentials_exception
                
            logger.info(f"Usuario autenticado: {user_id} ({email})")
            
            return {
                "id": user_id,
                "email": email,
                "payload": payload
            }
            
        except JWTError as jwt_error:
            logger.error(f"JWT Error: {str(jwt_error)}")
            raise credentials_exception
            
    except Exception as e:
        logger.error(f"Error in get_current_user: {str(e)}")
        raise credentials_exception

async def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[Dict[str, Any]]:
    """
    Versión opcional de get_current_user que devuelve None si no hay token
    """
    if not credentials:
        return None
        
    try:
        return await get_current_user(request, credentials)
    except HTTPException:
        return None

# Para desarrollo: función que permite usar mock user si no hay token
async def get_current_user_dev(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Dict[str, Any]:
    """
    Función de desarrollo que usa tu usuario real si no hay token JWT
    """
    if credentials:
        try:
            # Intentar usar el JWT real
            return await get_current_user(request, credentials)
        except HTTPException:
            logger.warning("Token JWT inválido, usando usuario de desarrollo")
    
    # Fallback a tu usuario real para desarrollo
    logger.info("Usando usuario de desarrollo (sin token JWT)")
    return {
        "id": "c1d5bed7-fa7c-41fe-947a-11be465cd512",
        "email": "dev@comsigns.com",
        "dev_mode": True
    }
