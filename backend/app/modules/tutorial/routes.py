"""
Tutorial routes for COMSIGNS
"""

from fastapi import APIRouter, HTTPException
from typing import List
from app.core.supabase import supabase_service

router = APIRouter()

# Datos de respaldo en caso de que Supabase no esté disponible
FALLBACK_TUTORIAL_LESSONS = [
    {"id": 1, "letter": "A", "name": "Letra A", "difficulty": "easy", "description": "Aprende la seña de la letra A"},
    {"id": 2, "letter": "B", "name": "Letra B", "difficulty": "easy", "description": "Aprende la seña de la letra B"},
    {"id": 3, "letter": "C", "name": "Letra C", "difficulty": "easy", "description": "Aprende la seña de la letra C"},
    {"id": 4, "letter": "D", "name": "Letra D", "difficulty": "easy", "description": "Aprende la seña de la letra D"},
    {"id": 5, "letter": "E", "name": "Letra E", "difficulty": "easy", "description": "Aprende la seña de la letra E"},
    {"id": 6, "letter": "F", "name": "Letra F", "difficulty": "easy", "description": "Aprende la seña de la letra F"},
    {"id": 7, "letter": "G", "name": "Letra G", "difficulty": "medium", "description": "Aprende la seña de la letra G"},
    {"id": 8, "letter": "H", "name": "Letra H", "difficulty": "medium", "description": "Aprende la seña de la letra H"},
    {"id": 9, "letter": "I", "name": "Letra I", "difficulty": "medium", "description": "Aprende la seña de la letra I"},
    {"id": 10, "letter": "K", "name": "Letra K", "difficulty": "medium", "description": "Aprende la seña de la letra K"},
    {"id": 11, "letter": "L", "name": "Letra L", "difficulty": "medium", "description": "Aprende la seña de la letra L"},
    {"id": 12, "letter": "M", "name": "Letra M", "difficulty": "medium", "description": "Aprende la seña de la letra M"},
    {"id": 13, "letter": "N", "name": "Letra N", "difficulty": "medium", "description": "Aprende la seña de la letra N"},
    {"id": 14, "letter": "O", "name": "Letra O", "difficulty": "hard", "description": "Aprende la seña de la letra O"},
    {"id": 15, "letter": "P", "name": "Letra P", "difficulty": "hard", "description": "Aprende la seña de la letra P"},
    {"id": 16, "letter": "Q", "name": "Letra Q", "difficulty": "hard", "description": "Aprende la seña de la letra Q"},
    {"id": 17, "letter": "R", "name": "Letra R", "difficulty": "hard", "description": "Aprende la seña de la letra R"},
    {"id": 18, "letter": "S", "name": "Letra S", "difficulty": "hard", "description": "Aprende la seña de la letra S"},
    {"id": 19, "letter": "T", "name": "Letra T", "difficulty": "hard", "description": "Aprende la seña de la letra T"},
    {"id": 20, "letter": "U", "name": "Letra U", "difficulty": "hard", "description": "Aprende la seña de la letra U"},
    {"id": 21, "letter": "V", "name": "Letra V", "difficulty": "hard", "description": "Aprende la seña de la letra V"},
    {"id": 22, "letter": "W", "name": "Letra W", "difficulty": "hard", "description": "Aprende la seña de la letra W"},
    {"id": 23, "letter": "X", "name": "Letra X", "difficulty": "hard", "description": "Aprende la seña de la letra X"},
    {"id": 24, "letter": "Y", "name": "Letra Y", "difficulty": "hard", "description": "Aprende la seña de la letra Y"}
]

@router.get("/")
async def tutorial_root():
    """
    Endpoint raíz del tutorial
    """
    # Intentar obtener lecciones desde Supabase
    lessons = await supabase_service.get_tutorial_lessons()
    
    # Si Supabase no está disponible, usar datos de respaldo
    if not lessons:
        lessons = FALLBACK_TUTORIAL_LESSONS
    
    return {
        "message": "Tutorial Interactivo COMSIGNS",
        "description": "Aprende el alfabeto del lenguaje de señas ecuatoriano paso a paso",
        "total_lessons": len(lessons),
        "difficulty_levels": ["easy", "medium", "hard"],
        "data_source": "supabase" if supabase_service.is_connected() else "fallback"
    }

@router.get("/lessons")
async def get_lessons():
    """
    Obtener todas las lecciones del tutorial
    """
    # Intentar obtener lecciones desde Supabase
    lessons = await supabase_service.get_tutorial_lessons()
    
    # Si Supabase no está disponible, usar datos de respaldo
    if not lessons:
        lessons = FALLBACK_TUTORIAL_LESSONS
    
    return {
        "lessons": lessons,
        "total": len(lessons),
        "data_source": "supabase" if supabase_service.is_connected() else "fallback"
    }

@router.get("/lessons/{lesson_id}")
async def get_lesson(lesson_id: int):
    """
    Obtener una lección específica
    """
    # Intentar obtener desde Supabase
    lesson = await supabase_service.get_tutorial_lesson_by_number(lesson_id)
    
    # Si no se encuentra en Supabase, buscar en datos de respaldo
    if not lesson:
        lesson = next((l for l in FALLBACK_TUTORIAL_LESSONS if l["id"] == lesson_id), None)
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lección no encontrada")
    
    return {
        **lesson,
        "data_source": "supabase" if supabase_service.is_connected() and lesson else "fallback"
    }

@router.get("/lessons/difficulty/{difficulty}")
async def get_lessons_by_difficulty(difficulty: str):
    """
    Obtener lecciones por nivel de dificultad
    """
    if difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(status_code=400, detail="Dificultad no válida. Use: easy, medium, hard")
    
    # Intentar obtener desde Supabase
    lessons = await supabase_service.get_tutorial_lessons_by_difficulty(difficulty)
    
    # Si Supabase no está disponible, usar datos de respaldo
    if not lessons:
        lessons = [l for l in FALLBACK_TUTORIAL_LESSONS if l["difficulty"] == difficulty]
    
    return {
        "difficulty": difficulty,
        "lessons": lessons,
        "total": len(lessons),
        "data_source": "supabase" if supabase_service.is_connected() else "fallback"
    }

@router.post("/lessons/{lesson_id}/complete")
async def complete_lesson(lesson_id: int):
    """
    Marcar una lección como completada
    """
    # Intentar obtener desde Supabase
    lesson = await supabase_service.get_tutorial_lesson_by_number(lesson_id)
    
    # Si no se encuentra en Supabase, buscar en datos de respaldo
    if not lesson:
        lesson = next((l for l in FALLBACK_TUTORIAL_LESSONS if l["id"] == lesson_id), None)
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lección no encontrada")
    
    # En una implementación real, guardaríamos esto en la base de datos
    return {
        "message": f"Lección {lesson.get('name', f'#{lesson_id}')} completada con éxito!",
        "lesson_id": lesson_id,
        "letter": lesson.get("letter", ""),
        "completed": True,
        "data_source": "supabase" if supabase_service.is_connected() and lesson else "fallback"
    }
