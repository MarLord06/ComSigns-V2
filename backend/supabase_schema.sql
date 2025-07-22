-- Esquema de base de datos para COMSIGNS v2.0 en Supabase
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Políticas RLS (Row Level Security) para Supabase
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora, se puede restringir más tarde)
CREATE POLICY "Allow all operations on user_sessions" ON user_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on ml_predictions" ON ml_predictions FOR ALL USING (true);
CREATE POLICY "Allow all operations on tutorial_progress" ON tutorial_progress FOR ALL USING (true);
CREATE POLICY "Allow all operations on practice_sessions" ON practice_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on practice_results" ON practice_results FOR ALL USING (true);
CREATE POLICY "Allow all operations on system_config" ON system_config FOR ALL USING (true);

-- Insertar configuración inicial del sistema
INSERT INTO system_config (key, value, description) VALUES
('model_version', '1.0', 'Versión actual del modelo ML'),
('confidence_threshold', '0.65', 'Umbral de confianza para predicciones'),
('max_session_duration_hours', '24', 'Duración máxima de sesión en horas'),
('tutorial_total_steps', '24', 'Total de pasos en el tutorial'),
('supported_letters', '["A","B","C","D","E","F","G","H","I","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y"]', 'Letras soportadas por el modelo')
ON CONFLICT (key) DO NOTHING;

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

-- Mensaje de finalización
SELECT 'Base de datos COMSIGNS v2.0 inicializada correctamente en Supabase' as status;
