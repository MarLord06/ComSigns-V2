"""
Excepciones personalizadas de la aplicación
"""

from fastapi import HTTPException, status


class ComsignsException(Exception):
    """
    Excepción base de COMSIGNS
    """
    def __init__(self, message: str, details: str = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class AuthenticationError(ComsignsException):
    """
    Error de autenticación
    """
    pass


class AuthorizationError(ComsignsException):
    """
    Error de autorización
    """
    pass


class ModelError(ComsignsException):
    """
    Error relacionado con el modelo ML
    """
    pass


class ValidationError(ComsignsException):
    """
    Error de validación de datos
    """
    pass


class DatabaseError(ComsignsException):
    """
    Error de base de datos
    """
    pass


# Excepciones HTTP específicas
class HTTPNotFoundException(HTTPException):
    """
    Recurso no encontrado
    """
    def __init__(self, detail: str = "Recurso no encontrado"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class HTTPUnauthorizedException(HTTPException):
    """
    No autorizado
    """
    def __init__(self, detail: str = "No autorizado"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class HTTPForbiddenException(HTTPException):
    """
    Acceso prohibido
    """
    def __init__(self, detail: str = "Acceso prohibido"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class HTTPBadRequestException(HTTPException):
    """
    Solicitud incorrecta
    """
    def __init__(self, detail: str = "Solicitud incorrecta"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class HTTPInternalServerErrorException(HTTPException):
    """
    Error interno del servidor
    """
    def __init__(self, detail: str = "Error interno del servidor"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )
