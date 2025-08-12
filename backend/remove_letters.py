#!/usr/bin/env python3
"""
Script para eliminar letras específicas de la base de datos
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def remove_letters():
    """Eliminar letras J, Ñ, Z de la base de datos"""
    
    # Configurar Supabase
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados")
        return
    
    supabase: Client = create_client(url, key)
    
    letters_to_remove = ['J', 'Ñ', 'Z']
    
    print("🗑️  Eliminando letras no compatibles con el modelo...")
    
    for letter in letters_to_remove:
        try:
            result = supabase.table('letters').delete().eq('letter', letter).execute()
            if result.data:
                print(f"    ✅ Letra '{letter}' eliminada")
            else:
                print(f"    ⚠️  Letra '{letter}' no encontrada")
        except Exception as e:
            print(f"    ❌ Error eliminando letra '{letter}': {e}")
    
    # Verificar letras restantes
    try:
        result = supabase.table('letters').select('letter').order('id').execute()
        remaining_letters = [item['letter'] for item in result.data]
        print(f"\n📝 Letras restantes ({len(remaining_letters)}): {', '.join(remaining_letters)}")
    except Exception as e:
        print(f"❌ Error verificando letras restantes: {e}")

if __name__ == "__main__":
    remove_letters()
