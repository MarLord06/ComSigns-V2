"""
Practice routes for COMSIGNS
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict
import random

router = APIRouter()

# Mock data for practice challenges (solo letras disponibles en el dataset original)
PRACTICE_CHALLENGES = [
    {"id": 1, "type": "recognition", "letter": "A", "description": "Identifica la letra A", "difficulty": "easy", "points": 10},
    {"id": 2, "type": "recognition", "letter": "B", "description": "Identifica la letra B", "difficulty": "easy", "points": 10},
    {"id": 3, "type": "recognition", "letter": "C", "description": "Identifica la letra C", "difficulty": "easy", "points": 10},
    {"id": 4, "type": "formation", "letter": "D", "description": "Forma la seña de la letra D", "difficulty": "medium", "points": 15},
    {"id": 5, "type": "formation", "letter": "E", "description": "Forma la seña de la letra E", "difficulty": "medium", "points": 15},
    {"id": 6, "type": "speed", "letter": "F", "description": "Forma la seña de F en menos de 3 segundos", "difficulty": "hard", "points": 25},
    {"id": 7, "type": "sequence", "letters": ["H", "O", "L", "A"], "description": "Forma la palabra HOLA", "difficulty": "hard", "points": 50}
]

# Mock leaderboard data
LEADERBOARD = [
    {"rank": 1, "username": "SeñasPro", "score": 1250, "level": "Experto"},
    {"rank": 2, "username": "ManosRápidas", "score": 980, "level": "Avanzado"},
    {"rank": 3, "username": "PrincipianteX", "score": 750, "level": "Intermedio"},
    {"rank": 4, "username": "AprendiendoSeñas", "score": 500, "level": "Principiante"},
    {"rank": 5, "username": "NuevoUsuario", "score": 250, "level": "Principiante"}
]

@router.get("/")
async def practice_root():
    """
    Endpoint raíz del modo práctica
    """
    return {
        "message": "Modo Práctica COMSIGNS",
        "description": "Practica y mejora tus habilidades con el lenguaje de señas ecuatoriano",
        "challenge_types": ["recognition", "formation", "speed", "sequence"],
        "total_challenges": len(PRACTICE_CHALLENGES),
        "gamification": "Sistema de puntos, niveles y ranking"
    }

@router.get("/challenges")
async def get_challenges():
    """
    Obtener todos los desafíos de práctica
    """
    return {
        "challenges": PRACTICE_CHALLENGES,
        "total": len(PRACTICE_CHALLENGES)
    }

@router.get("/challenges/random")
async def get_random_challenge():
    """
    Obtener un desafío aleatorio
    """
    challenge = random.choice(PRACTICE_CHALLENGES)
    return challenge

@router.get("/challenges/difficulty/{difficulty}")
async def get_challenges_by_difficulty(difficulty: str):
    """
    Obtener desafíos por nivel de dificultad
    """
    if difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(status_code=400, detail="Dificultad no válida. Use: easy, medium, hard")
    
    challenges = [c for c in PRACTICE_CHALLENGES if c["difficulty"] == difficulty]
    return {
        "difficulty": difficulty,
        "challenges": challenges,
        "total": len(challenges)
    }

@router.get("/challenges/type/{challenge_type}")
async def get_challenges_by_type(challenge_type: str):
    """
    Obtener desafíos por tipo
    """
    if challenge_type not in ["recognition", "formation", "speed", "sequence"]:
        raise HTTPException(status_code=400, detail="Tipo no válido. Use: recognition, formation, speed, sequence")
    
    challenges = [c for c in PRACTICE_CHALLENGES if c["type"] == challenge_type]
    return {
        "type": challenge_type,
        "challenges": challenges,
        "total": len(challenges)
    }

@router.post("/challenges/{challenge_id}/complete")
async def complete_challenge(challenge_id: int, score: int = 100):
    """
    Completar un desafío y obtener puntos
    """
    challenge = next((c for c in PRACTICE_CHALLENGES if c["id"] == challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafío no encontrado")
    
    # Calcular puntos basado en el score (0-100) y la dificultad
    base_points = challenge.get("points", 10)
    earned_points = int((score / 100) * base_points)
    
    return {
        "message": "¡Desafío completado!",
        "challenge_id": challenge_id,
        "score": score,
        "points_earned": earned_points,
        "total_possible": base_points,
        "performance": "Excelente" if score >= 80 else "Bueno" if score >= 60 else "Puede mejorar"
    }

@router.get("/leaderboard")
async def get_leaderboard():
    """
    Obtener la tabla de clasificación
    """
    return {
        "leaderboard": LEADERBOARD,
        "total_players": len(LEADERBOARD)
    }

@router.get("/stats")
async def get_practice_stats():
    """
    Obtener estadísticas del modo práctica
    """
    return {
        "total_challenges": len(PRACTICE_CHALLENGES),
        "challenges_by_difficulty": {
            "easy": len([c for c in PRACTICE_CHALLENGES if c["difficulty"] == "easy"]),
            "medium": len([c for c in PRACTICE_CHALLENGES if c["difficulty"] == "medium"]),
            "hard": len([c for c in PRACTICE_CHALLENGES if c["difficulty"] == "hard"])
        },
        "challenges_by_type": {
            "recognition": len([c for c in PRACTICE_CHALLENGES if c["type"] == "recognition"]),
            "formation": len([c for c in PRACTICE_CHALLENGES if c["type"] == "formation"]),
            "speed": len([c for c in PRACTICE_CHALLENGES if c["type"] == "speed"]),
            "sequence": len([c for c in PRACTICE_CHALLENGES if c["type"] == "sequence"])
        },
        "max_points_available": sum(c.get("points", 0) for c in PRACTICE_CHALLENGES)
    }
