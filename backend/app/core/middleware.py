"""
Middleware personalizado para la aplicación
"""

import time
import json
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware para logging de requests y responses
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Información del request
        start_time = time.time()
        client_ip = request.client.host if request.client else "unknown"
        
        # Log del request entrante
        logger.info(
            "Request incoming",
            extra={
                "method": request.method,
                "url": str(request.url),
                "client_ip": client_ip,
                "user_agent": request.headers.get("user-agent", "unknown")
            }
        )
        
        # Procesar request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log del response
            logger.info(
                "Request completed",
                extra={
                    "method": request.method,
                    "url": str(request.url),
                    "status_code": response.status_code,
                    "process_time": round(process_time, 4),
                    "client_ip": client_ip
                }
            )
            
            # Agregar headers de performance
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            
            # Log del error
            logger.error(
                "Request failed",
                extra={
                    "method": request.method,
                    "url": str(request.url),
                    "error": str(e),
                    "process_time": round(process_time, 4),
                    "client_ip": client_ip
                }
            )
            
            raise e


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware para agregar headers de seguridad
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Headers de seguridad básicos
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # CSP básico para API
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        return response
