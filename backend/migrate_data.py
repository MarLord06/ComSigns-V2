#!/usr/bin/env python3
"""
Script para migrar datos estáticos a Supabase
"""

import asyncio
import sys
import os

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.supabase import supabase_service

async def migrate_tutorial_lessons():
    """
    Migrar lecciones del tutorial a Supabase
    """
    print("📚 Migrando lecciones del tutorial...")
    
    lessons_data = [
        (1, 'A', 'Letra A', 'easy', 'Aprende la seña de la letra A', '["Puño cerrado con pulgar al lado", "Mantén el puño bien cerrado", "El pulgar debe estar visible al lado"]'),
        (2, 'B', 'Letra B', 'easy', 'Aprende la seña de la letra B', '["Mano abierta, dedos juntos, pulgar doblado", "Dedos bien rectos", "Pulgar pegado a la palma"]'),
        (3, 'C', 'Letra C', 'easy', 'Aprende la seña de la letra C', '["Mano curvada como una C", "Forma una C con toda la mano", "Mantén la curvatura uniforme"]'),
        # ... agregar más lecciones según necesidad
    ]
    
    if not supabase_service.is_connected():
        print("❌ Supabase no está conectado. Verifica la configuración.")
        return False
    
    try:
        for lesson_data in lessons_data:
            lesson_number, letter, name, difficulty, description, tips = lesson_data
            
            # Verificar si ya existe
            existing = await supabase_service.get_tutorial_lesson_by_number(lesson_number)
            
            if not existing:
                # Insertar nueva lección
                result = supabase_service.supabase.table("tutorial_lessons").insert({
                    "lesson_number": lesson_number,
                    "letter": letter,
                    "name": name,
                    "difficulty": difficulty,
                    "description": description,
                    "tips": tips,
                    "estimated_time_minutes": 3
                }).execute()
                
                if result.data:
                    print(f"✅ Lección {lesson_number} ({letter}) migrada correctamente")
                else:
                    print(f"❌ Error migrando lección {lesson_number}")
            else:
                print(f"⚠️  Lección {lesson_number} ({letter}) ya existe, omitiendo...")
    
        print("✅ Migración de lecciones completada")
        return True
        
    except Exception as e:
        print(f"❌ Error durante la migración de lecciones: {str(e)}")
        return False

async def migrate_practice_challenges():
    """
    Migrar desafíos de práctica a Supabase
    """
    print("🎮 Migrando desafíos de práctica...")
    
    challenges_data = [
        (1, 'recognition', 'A', None, 'Reconoce la letra A', 'Identifica la letra A', 'easy', 10, 5),
        (2, 'recognition', 'B', None, 'Reconoce la letra B', 'Identifica la letra B', 'easy', 10, 5),
        (3, 'formation', 'D', None, 'Forma la letra D', 'Forma la seña de la letra D', 'medium', 15, 8),
        (4, 'sequence', None, '["H", "O", "L", "A"]', 'Palabra HOLA', 'Forma la palabra HOLA', 'hard', 50, 15),
        # ... agregar más desafíos según necesidad
    ]
    
    if not supabase_service.is_connected():
        print("❌ Supabase no está conectado. Verifica la configuración.")
        return False
    
    try:
        for challenge_data in challenges_data:
            challenge_number, type_, letter, letters, name, description, difficulty, points, time_limit = challenge_data
            
            # Verificar si ya existe
            existing = supabase_service.supabase.table("practice_challenges").select("*").eq("challenge_number", challenge_number).execute()
            
            if not existing.data:
                # Insertar nuevo desafío
                result = supabase_service.supabase.table("practice_challenges").insert({
                    "challenge_number": challenge_number,
                    "type": type_,
                    "letter": letter,
                    "letters": letters,
                    "name": name,
                    "description": description,
                    "difficulty": difficulty,
                    "points": points,
                    "time_limit_seconds": time_limit
                }).execute()
                
                if result.data:
                    print(f"✅ Desafío {challenge_number} ({name}) migrado correctamente")
                else:
                    print(f"❌ Error migrando desafío {challenge_number}")
            else:
                print(f"⚠️  Desafío {challenge_number} ({name}) ya existe, omitiendo...")
    
        print("✅ Migración de desafíos completada")
        return True
        
    except Exception as e:
        print(f"❌ Error durante la migración de desafíos: {str(e)}")
        return False

async def verify_migration():
    """
    Verificar que la migración se realizó correctamente
    """
    print("🔍 Verificando migración...")
    
    if not supabase_service.is_connected():
        print("❌ Supabase no está conectado.")
        return False
    
    try:
        # Verificar lecciones
        lessons = await supabase_service.get_tutorial_lessons()
        print(f"📚 Lecciones en Supabase: {len(lessons)}")
        
        # Verificar desafíos
        challenges = await supabase_service.get_practice_challenges()
        print(f"🎮 Desafíos en Supabase: {len(challenges)}")
        
        print("✅ Verificación completada")
        return True
        
    except Exception as e:
        print(f"❌ Error durante la verificación: {str(e)}")
        return False

async def main():
    """
    Función principal de migración
    """
    print("🚀 Iniciando migración de datos a Supabase...")
    print("=" * 50)
    
    # Verificar conexión a Supabase
    if not supabase_service.is_connected():
        print("❌ Error: Supabase no está configurado o no está disponible.")
        print("   Verifica las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY")
        return
    
    print("✅ Conexión a Supabase verificada")
    
    # Migrar datos
    success = True
    
    success &= await migrate_tutorial_lessons()
    success &= await migrate_practice_challenges()
    
    if success:
        await verify_migration()
        print("\n🎉 Migración completada exitosamente!")
        print("   Los datos estáticos ahora están almacenados en Supabase.")
        print("   La API usará automáticamente los datos de Supabase cuando esté disponible.")
    else:
        print("\n❌ La migración falló parcialmente.")
        print("   Revisa los errores anteriores y ejecuta el script nuevamente.")

if __name__ == "__main__":
    asyncio.run(main())
