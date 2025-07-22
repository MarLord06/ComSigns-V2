-- Inicialización de la base de datos
-- Script que se ejecuta al crear el contenedor de PostgreSQL

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear índices adicionales si es necesario
-- (Las tablas se crean automáticamente con SQLAlchemy)

-- Configurar timezone
SET timezone = 'UTC';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos COMSIGNS inicializada correctamente';
END $$;
