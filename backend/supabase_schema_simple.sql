-- =============================================
-- COMSIGNS V2.0 - SCHEMA SIMPLE PARA GAMIFICACIÓN
-- Version simplificada para funcionalidad inmediata
-- =============================================

-- =============================================
-- 🗂️ TABLAS BÁSICAS
-- =============================================

-- Tabla de letras para el modelo ML (sin dependencias)
CREATE TABLE IF NOT EXISTS public.letters (
    id SERIAL PRIMARY KEY,
    letter VARCHAR(1) UNIQUE NOT NULL,
    description TEXT
);

-- Tabla simple de logros (sin dependencias)
CREATE TABLE IF NOT EXISTS public.achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon TEXT,
    points_required INTEGER DEFAULT 0,
    type VARCHAR(50) -- 'points', 'streak', 'accuracy', etc.
);

-- Tabla de perfiles de usuario (conectado a auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    avatar_url TEXT,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    games_played INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0.0,
    longest_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de sesiones de juego
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    level INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    words_completed INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 10,
    lives_remaining INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de intentos de juego (una por palabra/letra)
CREATE TABLE IF NOT EXISTS public.game_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_word TEXT NOT NULL,
    word_index INTEGER NOT NULL,
    predicted_letters JSONB, -- Array de predicciones de letras
    is_correct BOOLEAN NOT NULL,
    time_taken_seconds DECIMAL(10,2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de predicciones ML (para análisis)
CREATE TABLE IF NOT EXISTS public.ml_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    game_session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    target_letter VARCHAR(1) NOT NULL,
    predicted_letter VARCHAR(1) NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de logros de usuario
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id INTEGER REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Tabla simple para progreso de tutorial
CREATE TABLE IF NOT EXISTS public.tutorial_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    step_number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, step_number)
);

-- =============================================
-- � ÍNDICES BÁSICOS
-- =============================================

CREATE INDEX IF NOT EXISTS idx_letters_letter ON public.letters(letter);
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON public.user_profiles(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_started ON public.game_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_attempts_session ON public.game_attempts(game_session_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_user ON public.game_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_word ON public.game_attempts(target_word);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_user ON public.ml_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_session ON public.ml_predictions(game_session_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_user ON public.tutorial_progress(user_id);

-- =============================================
-- ⚙️ FUNCIONES Y TRIGGERS
-- =============================================

-- Función para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE OR REPLACE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_game_sessions_updated_at
    BEFORE UPDATE ON public.game_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_tutorial_progress_updated_at
    BEFORE UPDATE ON public.tutorial_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 🔒 ROW LEVEL SECURITY (RLS) - SIMPLIFICADO
-- =============================================

-- Por ahora desactivamos RLS para facilitar desarrollo
-- En producción activar y configurar con autenticación real

-- Activar RLS (comentado por ahora)
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.game_attempts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tutorial_progress ENABLE ROW LEVEL SECURITY;

-- Políticas simples de acceso público por ahora
-- En producción cambiar a políticas basadas en usuario

-- =============================================
-- 🌱 DATOS INICIALES
-- =============================================

-- Insertar letras del alfabeto español (sin J, Ñ, Z por limitaciones del modelo)
INSERT INTO public.letters (letter, description) VALUES
('A', 'Letra A'), ('B', 'Letra B'), ('C', 'Letra C'), ('D', 'Letra D'), ('E', 'Letra E'),
('F', 'Letra F'), ('G', 'Letra G'), ('H', 'Letra H'), ('I', 'Letra I'), 
('K', 'Letra K'), ('L', 'Letra L'), ('M', 'Letra M'), ('N', 'Letra N'),
('O', 'Letra O'), ('P', 'Letra P'), ('Q', 'Letra Q'), ('R', 'Letra R'), ('S', 'Letra S'),
('T', 'Letra T'), ('U', 'Letra U'), ('V', 'Letra V'), ('W', 'Letra W'), ('X', 'Letra X'),
('Y', 'Letra Y')
ON CONFLICT (letter) DO NOTHING;

-- Insertar logros básicos
INSERT INTO public.achievements (name, description, icon, points_required, type) VALUES
('Primera Letra', 'Reconoce tu primera letra correctamente', '🎯', 0, 'first'),
('Racha de 5', 'Consigue 5 aciertos seguidos', '🔥', 0, 'streak'),
('100 Puntos', 'Alcanza 100 puntos', '💯', 100, 'points'),
('Velocista', 'Completa una palabra en menos de 3 segundos', '⚡', 0, 'speed'),
('Dedicado', 'Juega 5 días seguidos', '📅', 0, 'daily')
ON CONFLICT DO NOTHING;
