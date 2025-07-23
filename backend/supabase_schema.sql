-- Esquema de base de datos para COMSIGNS v2.0 en Supabase
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar tablas existentes si existen (en orden correcto para evitar errores de dependencias)
DROP TABLE IF EXISTS practice_results CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS tutorial_progress CASCADE;
DROP TABLE IF EXISTS ml_predictions CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;

-- Eliminar vistas si existen
DROP VIEW IF EXISTS stats_overview CASCADE;
DROP VIEW IF EXISTS top_predicted_letters CASCADE;
DROP VIEW IF EXISTS practice_leaderboard CASCADE;

-- Tabla de sesiones de usuario
CREATE TABLE user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de predicciones ML
CREATE TABLE ml_predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES user_sessions(session_id),
    predicted_letter VARCHAR(1) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    processing_time_ms DECIMAL(10,2) NOT NULL,
    landmarks_data JSONB,
    model_version VARCHAR(50) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de progreso del tutorial
CREATE TABLE tutorial_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES user_sessions(session_id),
    letter VARCHAR(1) NOT NULL,
    step_number INTEGER NOT NULL CHECK (step_number > 0),
    is_completed BOOLEAN DEFAULT false,
    attempts INTEGER DEFAULT 1 CHECK (attempts > 0),
    time_spent_seconds INTEGER DEFAULT 0 CHECK (time_spent_seconds >= 0),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de sesiones de práctica
CREATE TABLE practice_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES user_sessions(session_id),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    target_letters JSONB NOT NULL,
    total_exercises INTEGER NOT NULL CHECK (total_exercises > 0),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de resultados de práctica
CREATE TABLE practice_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES user_sessions(session_id),
    practice_session_id UUID REFERENCES practice_sessions(id),
    score INTEGER NOT NULL CHECK (score >= 0),
    accuracy DECIMAL(5,2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
    total_time_seconds INTEGER NOT NULL CHECK (total_time_seconds > 0),
    correct_predictions INTEGER NOT NULL CHECK (correct_predictions >= 0),
    total_predictions INTEGER NOT NULL CHECK (total_predictions > 0),
    detailed_results JSONB,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de lecciones del tutorial
CREATE TABLE tutorial_lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lesson_number INTEGER UNIQUE NOT NULL CHECK (lesson_number > 0),
    letter VARCHAR(1) NOT NULL,
    name VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    description TEXT NOT NULL,
    tips JSONB DEFAULT '[]',
    estimated_time_minutes INTEGER DEFAULT 3 CHECK (estimated_time_minutes > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de desafíos de práctica
CREATE TABLE practice_challenges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    challenge_number INTEGER UNIQUE NOT NULL CHECK (challenge_number > 0),
    type VARCHAR(20) NOT NULL CHECK (type IN ('recognition', 'formation', 'speed', 'sequence')),
    letter VARCHAR(1),
    letters JSONB, -- Para secuencias como "HOLA"
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    points INTEGER NOT NULL CHECK (points > 0),
    time_limit_seconds INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración del sistema
CREATE TABLE system_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_ml_predictions_session_id ON ml_predictions(session_id);
CREATE INDEX idx_ml_predictions_letter ON ml_predictions(predicted_letter);
CREATE INDEX idx_ml_predictions_created_at ON ml_predictions(created_at);

CREATE INDEX idx_tutorial_progress_session_id ON tutorial_progress(session_id);
CREATE INDEX idx_tutorial_progress_letter ON tutorial_progress(letter);

CREATE INDEX idx_practice_sessions_session_id ON practice_sessions(session_id);
CREATE INDEX idx_practice_sessions_difficulty ON practice_sessions(difficulty);

CREATE INDEX idx_practice_results_session_id ON practice_results(session_id);
CREATE INDEX idx_practice_results_score ON practice_results(score DESC);
CREATE INDEX idx_practice_results_accuracy ON practice_results(accuracy DESC);

CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

-- Índices para las nuevas tablas
CREATE INDEX idx_tutorial_lessons_lesson_number ON tutorial_lessons(lesson_number);
CREATE INDEX idx_tutorial_lessons_letter ON tutorial_lessons(letter);
CREATE INDEX idx_tutorial_lessons_difficulty ON tutorial_lessons(difficulty);

CREATE INDEX idx_practice_challenges_challenge_number ON practice_challenges(challenge_number);
CREATE INDEX idx_practice_challenges_type ON practice_challenges(type);
CREATE INDEX idx_practice_challenges_difficulty ON practice_challenges(difficulty);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_config_updated_at 
    BEFORE UPDATE ON system_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorial_lessons_updated_at 
    BEFORE UPDATE ON tutorial_lessons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_challenges_updated_at 
    BEFORE UPDATE ON practice_challenges 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security) para Supabase
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_challenges ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora, se puede restringir más tarde)
CREATE POLICY "Allow all operations on user_sessions" ON user_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on ml_predictions" ON ml_predictions FOR ALL USING (true);
CREATE POLICY "Allow all operations on tutorial_progress" ON tutorial_progress FOR ALL USING (true);
CREATE POLICY "Allow all operations on practice_sessions" ON practice_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on practice_results" ON practice_results FOR ALL USING (true);
CREATE POLICY "Allow all operations on system_config" ON system_config FOR ALL USING (true);
CREATE POLICY "Allow all operations on tutorial_lessons" ON tutorial_lessons FOR ALL USING (true);
CREATE POLICY "Allow all operations on practice_challenges" ON practice_challenges FOR ALL USING (true);

-- Insertar configuración inicial del sistema
INSERT INTO system_config (key, value, description) VALUES
('model_version', '1.0', 'Versión actual del modelo ML'),
('confidence_threshold', '0.65', 'Umbral de confianza para predicciones'),
('max_session_duration_hours', '24', 'Duración máxima de sesión en horas'),
('tutorial_total_steps', '24', 'Total de pasos en el tutorial'),
('supported_letters', '["A","B","C","D","E","F","G","H","I","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y"]', 'Letras soportadas por el modelo')
ON CONFLICT (key) DO NOTHING;

-- Insertar lecciones del tutorial
INSERT INTO tutorial_lessons (lesson_number, letter, name, difficulty, description, tips) VALUES
(1, 'A', 'Letra A', 'easy', 'Aprende la seña de la letra A', '["Puño cerrado con pulgar al lado", "Mantén el puño bien cerrado", "El pulgar debe estar visible al lado"]'),
(2, 'B', 'Letra B', 'easy', 'Aprende la seña de la letra B', '["Mano abierta, dedos juntos, pulgar doblado", "Dedos bien rectos", "Pulgar pegado a la palma"]'),
(3, 'C', 'Letra C', 'easy', 'Aprende la seña de la letra C', '["Mano curvada como una C", "Forma una C con toda la mano", "Mantén la curvatura uniforme"]'),
(4, 'D', 'Letra D', 'easy', 'Aprende la seña de la letra D', '["Dedo índice extendido, otros doblados", "Mantén el índice bien recto", "Pulgar tocando los otros dedos"]'),
(5, 'E', 'Letra E', 'easy', 'Aprende la seña de la letra E', '["Dedos doblados hacia la palma", "Todos los dedos curvados", "Pulgar sobre los otros dedos"]'),
(6, 'F', 'Letra F', 'easy', 'Aprende la seña de la letra F', '["Índice y pulgar en círculo", "Otros dedos extendidos", "Forma un círculo perfecto"]'),
(7, 'G', 'Letra G', 'medium', 'Aprende la seña de la letra G', '["Índice y pulgar extendidos horizontalmente", "Forma una pistola", "Otros dedos cerrados"]'),
(8, 'H', 'Letra H', 'medium', 'Aprende la seña de la letra H', '["Índice y medio extendidos juntos", "Dedos paralelos", "Otros dedos cerrados"]'),
(9, 'I', 'Letra I', 'medium', 'Aprende la seña de la letra I', '["Solo el meñique extendido", "Otros dedos cerrados", "Pulgar sobre los dedos"]'),
(10, 'K', 'Letra K', 'medium', 'Aprende la seña de la letra K', '["Índice y medio en V, pulgar entre ellos", "Forma específica con tres dedos", "Otros dedos cerrados"]'),
(11, 'L', 'Letra L', 'medium', 'Aprende la seña de la letra L', '["Índice y pulgar en L", "Ángulo de 90 grados", "Otros dedos cerrados"]'),
(12, 'M', 'Letra M', 'medium', 'Aprende la seña de la letra M', '["Tres dedos sobre el pulgar", "Pulgar entre índice y medio", "Forma específica M"]'),
(13, 'N', 'Letra N', 'medium', 'Aprende la seña de la letra N', '["Dos dedos sobre el pulgar", "Índice y medio sobre pulgar", "Anular y meñique cerrados"]'),
(14, 'O', 'Letra O', 'hard', 'Aprende la seña de la letra O', '["Todos los dedos forman un círculo", "Dedos curvados tocándose", "Forma una O perfecta"]'),
(15, 'P', 'Letra P', 'hard', 'Aprende la seña de la letra P', '["Como K pero hacia abajo", "Índice y medio apuntando abajo", "Pulgar entre los dedos"]'),
(16, 'Q', 'Letra Q', 'hard', 'Aprende la seña de la letra Q', '["Índice y pulgar hacia abajo", "Como G pero apuntando abajo", "Otros dedos cerrados"]'),
(17, 'R', 'Letra R', 'hard', 'Aprende la seña de la letra R', '["Índice y medio cruzados", "Dedos entrelazados", "Otros dedos cerrados"]'),
(18, 'S', 'Letra S', 'hard', 'Aprende la seña de la letra S', '["Puño cerrado con pulgar sobre dedos", "Pulgar encima del puño", "Todos los dedos cerrados"]'),
(19, 'T', 'Letra T', 'hard', 'Aprende la seña de la letra T', '["Pulgar entre índice y medio", "Dedos cerrados excepto posición", "Forma específica de T"]'),
(20, 'U', 'Letra U', 'hard', 'Aprende la seña de la letra U', '["Índice y medio extendidos juntos", "Dedos paralelos hacia arriba", "Otros dedos cerrados"]'),
(21, 'V', 'Letra V', 'hard', 'Aprende la seña de la letra V', '["Índice y medio en V", "Dedos separados en V", "Otros dedos cerrados"]'),
(22, 'W', 'Letra W', 'hard', 'Aprende la seña de la letra W', '["Tres dedos extendidos", "Índice, medio y anular", "Meñique y pulgar cerrados"]'),
(23, 'X', 'Letra X', 'hard', 'Aprende la seña de la letra X', '["Índice curvado", "Dedo en forma de gancho", "Otros dedos cerrados"]'),
(24, 'Y', 'Letra Y', 'hard', 'Aprende la seña de la letra Y', '["Pulgar y meñique extendidos", "Como teléfono", "Otros dedos cerrados"]')
ON CONFLICT (lesson_number) DO NOTHING;

-- Insertar desafíos de práctica
INSERT INTO practice_challenges (challenge_number, type, letter, letters, name, description, difficulty, points, time_limit_seconds) VALUES
(1, 'recognition', 'A', NULL, 'Reconoce la letra A', 'Identifica la letra A', 'easy', 10, 5),
(2, 'recognition', 'B', NULL, 'Reconoce la letra B', 'Identifica la letra B', 'easy', 10, 5),
(3, 'recognition', 'C', NULL, 'Reconoce la letra C', 'Identifica la letra C', 'easy', 10, 5),
(4, 'formation', 'D', NULL, 'Forma la letra D', 'Forma la seña de la letra D', 'medium', 15, 8),
(5, 'formation', 'E', NULL, 'Forma la letra E', 'Forma la seña de la letra E', 'medium', 15, 8),
(6, 'speed', 'F', NULL, 'Letra F rápida', 'Forma la seña de F en menos de 3 segundos', 'hard', 25, 3),
(7, 'sequence', NULL, '["H", "O", "L", "A"]', 'Palabra HOLA', 'Forma la palabra HOLA', 'hard', 50, 15),
(8, 'recognition', 'G', NULL, 'Reconoce la letra G', 'Identifica la letra G', 'medium', 12, 6),
(9, 'formation', 'H', NULL, 'Forma la letra H', 'Forma la seña de la letra H', 'medium', 15, 8),
(10, 'speed', 'I', NULL, 'Letra I rápida', 'Forma la seña de I en menos de 3 segundos', 'hard', 25, 3),
(11, 'recognition', 'K', NULL, 'Reconoce la letra K', 'Identifica la letra K', 'medium', 12, 6),
(12, 'formation', 'L', NULL, 'Forma la letra L', 'Forma la seña de la letra L', 'medium', 15, 8),
(13, 'sequence', NULL, '["M", "A", "M", "A"]', 'Palabra MAMA', 'Forma la palabra MAMA', 'hard', 50, 20),
(14, 'speed', 'N', NULL, 'Letra N rápida', 'Forma la seña de N en menos de 4 segundos', 'hard', 25, 4),
(15, 'formation', 'O', NULL, 'Forma la letra O', 'Forma la seña de la letra O', 'hard', 20, 10),
(16, 'recognition', 'P', NULL, 'Reconoce la letra P', 'Identifica la letra P', 'hard', 15, 7),
(17, 'formation', 'Q', NULL, 'Forma la letra Q', 'Forma la seña de la letra Q', 'hard', 20, 10),
(18, 'speed', 'R', NULL, 'Letra R rápida', 'Forma la seña de R en menos de 5 segundos', 'hard', 30, 5),
(19, 'formation', 'S', NULL, 'Forma la letra S', 'Forma la seña de la letra S', 'hard', 20, 10),
(20, 'sequence', NULL, '["S", "O", "L"]', 'Palabra SOL', 'Forma la palabra SOL', 'medium', 35, 12),
(21, 'recognition', 'T', NULL, 'Reconoce la letra T', 'Identifica la letra T', 'hard', 15, 7),
(22, 'formation', 'U', NULL, 'Forma la letra U', 'Forma la seña de la letra U', 'hard', 20, 10),
(23, 'formation', 'V', NULL, 'Forma la letra V', 'Forma la seña de la letra V', 'medium', 15, 8),
(24, 'formation', 'W', NULL, 'Forma la letra W', 'Forma la seña de la letra W', 'hard', 20, 10),
(25, 'speed', 'X', NULL, 'Letra X rápida', 'Forma la seña de X en menos de 4 segundos', 'hard', 30, 4),
(26, 'formation', 'Y', NULL, 'Forma la letra Y', 'Forma la seña de la letra Y', 'hard', 20, 10),
(27, 'sequence', NULL, '["A", "M", "O", "R"]', 'Palabra AMOR', 'Forma la palabra AMOR', 'hard', 60, 25)
ON CONFLICT (challenge_number) DO NOTHING;

-- Vista para estadísticas generales
CREATE OR REPLACE VIEW stats_overview AS
SELECT 
    COUNT(DISTINCT us.session_id) as total_sessions,
    COUNT(mp.id) as total_predictions,
    ROUND(AVG(mp.confidence)::numeric, 4) as avg_confidence,
    ROUND(AVG(mp.processing_time_ms)::numeric, 2) as avg_processing_time_ms,
    COUNT(DISTINCT tp.session_id) as users_in_tutorial,
    COUNT(DISTINCT ps.session_id) as users_in_practice,
    ROUND(AVG(pr.accuracy)::numeric, 2) as avg_practice_accuracy
FROM user_sessions us
LEFT JOIN ml_predictions mp ON us.session_id = mp.session_id
LEFT JOIN tutorial_progress tp ON us.session_id = tp.session_id
LEFT JOIN practice_sessions ps ON us.session_id = ps.session_id
LEFT JOIN practice_results pr ON us.session_id = pr.session_id;

-- Vista para top predicciones por letra
CREATE OR REPLACE VIEW top_predicted_letters AS
SELECT 
    predicted_letter,
    COUNT(*) as prediction_count,
    ROUND(AVG(confidence)::numeric, 4) as avg_confidence,
    ROUND(AVG(processing_time_ms)::numeric, 2) as avg_processing_time_ms
FROM ml_predictions 
WHERE status = 'success'
GROUP BY predicted_letter
ORDER BY prediction_count DESC;

-- Vista para leaderboard de práctica
CREATE OR REPLACE VIEW practice_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY score DESC, accuracy DESC) as rank,
    session_id,
    score,
    accuracy,
    total_time_seconds,
    completed_at
FROM practice_results
ORDER BY score DESC, accuracy DESC
LIMIT 100;

-- Comentarios en las tablas
COMMENT ON TABLE user_sessions IS 'Sesiones de usuario activas y históricas';
COMMENT ON TABLE ml_predictions IS 'Predicciones realizadas por el modelo ML';
COMMENT ON TABLE tutorial_progress IS 'Progreso de usuarios en el tutorial interactivo';
COMMENT ON TABLE practice_sessions IS 'Sesiones de práctica de usuarios';
COMMENT ON TABLE practice_results IS 'Resultados y puntuaciones de sesiones de práctica';
COMMENT ON TABLE system_config IS 'Configuración global del sistema';
COMMENT ON TABLE tutorial_lessons IS 'Lecciones del tutorial con información detallada';
COMMENT ON TABLE practice_challenges IS 'Desafíos y retos del modo práctica';

-- Mensaje de finalización
SELECT 'Base de datos COMSIGNS v2.0 inicializada correctamente en Supabase' as status;
