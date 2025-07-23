#!/bin/bash

# Script para iniciar el proyecto COMSIGNS en desarrollo

echo "🤟 Iniciando COMSIGNS v2.0 - Backend"
echo "=================================="

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar Docker Compose (moderno o legacy)
if ! docker compose version &> /dev/null; then
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose no está disponible. Usando docker-compose alternativo..."
        # Intentar descargar docker-compose si no está disponible
        if command -v curl &> /dev/null; then
            echo "📥 Descargando Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        else
            echo "❌ No se puede instalar Docker Compose automáticamente."
            echo "📝 Instala Docker Compose manualmente:"
            echo "   sudo apt-get update && sudo apt-get install docker-compose-plugin"
            exit 1
        fi
    fi
    DOCKER_COMPOSE_CMD="docker-compose"
else
    DOCKER_COMPOSE_CMD="docker compose"
fi

# Crear archivo .env si no existe
if [ ! -f "./backend/.env" ]; then
    echo "📄 Creando archivo .env..."
    cp ./backend/.env.example ./backend/.env
    echo "✅ Archivo .env creado. Puedes modificarlo según tus necesidades."
fi

# Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
mkdir -p ./backend/logs
mkdir -p ./frontend
mkdir -p ./docs

# Levantar servicios con Docker Compose
echo "🐳 Iniciando servicios con Docker Compose..."
$DOCKER_COMPOSE_CMD -f docker-compose.dev.yml up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de los servicios
echo "🔍 Verificando estado de los servicios..."
$DOCKER_COMPOSE_CMD -f docker-compose.dev.yml ps

echo ""
echo "🎉 ¡COMSIGNS está listo!"
echo ""
echo "📍 Servicios disponibles:"
echo "   • API Backend:    http://localhost:8000"
echo "   • Documentación:  http://localhost:8000/docs"
echo "   • Base de datos:  localhost:5432"
echo "   • Redis:          localhost:6379"
echo "   • Adminer (BD):   http://localhost:8080"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver logs:       $DOCKER_COMPOSE_CMD -f docker-compose.dev.yml logs -f"
echo "   • Detener:        $DOCKER_COMPOSE_CMD -f docker-compose.dev.yml down"
echo "   • Reiniciar:      $DOCKER_COMPOSE_CMD -f docker-compose.dev.yml restart"
echo ""
echo "📚 Para acceder a la documentación interactiva:"
echo "   Abre http://localhost:8000/docs en tu navegador"
