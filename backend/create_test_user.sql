-- Script para crear usuario de prueba en auth.users
-- Ejecutar esto en Supabase SQL Editor

-- Insertar usuario dummy en auth.users (para desarrollo)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'test@example.com',
    '$2a$10$dummypasswordhash',  -- Hash dummy
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Crear perfil de usuario correspondiente
INSERT INTO public.user_profiles (
    id,
    username,
    full_name,
    total_points,
    current_level,
    games_played,
    accuracy_percentage,
    longest_streak,
    current_streak
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'test_user',
    'Usuario de Prueba',
    0,
    1,
    0,
    0.0,
    0,
    0
) ON CONFLICT (id) DO NOTHING;
