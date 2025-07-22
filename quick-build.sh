#!/bin/bash

# Script de construcción rápida para desarrollo
# Este script optimiza el proceso de construcción para desarrollo

set -e

echo "🚀 Iniciando construcción rápida del backend..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función de logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si Docker está ejecutándose
if ! docker info > /dev/null 2>&1; then
    error "Docker no está ejecutándose. Por favor, inicia Docker."
    exit 1
fi

# Crear cache personalizado para dependencias
CACHE_DIR="$HOME/.comsigns-cache"
mkdir -p "$CACHE_DIR"

log "Verificando cache de dependencias..."

# Verificar si la imagen base existe
if docker images | grep -q "comsigns-base"; then
    success "Imagen base encontrada en cache"
    USE_CACHE="--cache-from comsigns-base"
else
    warning "Imagen base no encontrada, se construirá desde cero"
    USE_CACHE=""
fi

# Construir solo si ha cambiado requirements.txt
REQ_HASH=$(md5sum backend/requirements.txt | cut -d' ' -f1)
LAST_HASH_FILE="$CACHE_DIR/last_requirements_hash"

if [ -f "$LAST_HASH_FILE" ]; then
    LAST_HASH=$(cat "$LAST_HASH_FILE")
    if [ "$REQ_HASH" = "$LAST_HASH" ]; then
        success "Requirements.txt sin cambios, usando cache de dependencias"
        REBUILD_DEPS=false
    else
        warning "Requirements.txt modificado, reconstruyendo dependencias"
        REBUILD_DEPS=true
    fi
else
    warning "Primera construcción, instalando todas las dependencias"
    REBUILD_DEPS=true
fi

# Construir imagen optimizada
log "Construyendo imagen con optimizaciones..."

# Usar BuildKit para construcción paralela y cache mejorado
export DOCKER_BUILDKIT=1

# Construir con cache y optimizaciones
docker build \
    --progress=plain \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    $USE_CACHE \
    -t comsigns-backend-fast \
    -f backend/Dockerfile \
    backend/

if [ $? -eq 0 ]; then
    success "Construcción completada exitosamente"
    
    # Guardar hash actual
    echo "$REQ_HASH" > "$LAST_HASH_FILE"
    
    # Detener contenedor anterior si existe
    log "Deteniendo contenedor anterior..."
    docker stop comsigns-backend 2>/dev/null || true
    docker rm comsigns-backend 2>/dev/null || true
    
    # Iniciar nuevo contenedor
    log "Iniciando nuevo contenedor..."
    docker run -d \
        --name comsigns-backend \
        -p 8000:8000 \
        -v "$(pwd)/backend:/app" \
        -v "$(pwd)/backend/models:/app/models" \
        --env-file backend/.env \
        comsigns-backend-fast
    
    success "Backend iniciado en http://localhost:8000"
    log "Logs del contenedor: docker logs -f comsigns-backend"
    
else
    error "Error en la construcción"
    exit 1
fi

# Mostrar estadísticas
echo ""
echo "📊 Estadísticas:"
echo "- Imagen: comsigns-backend-fast"
echo "- Puerto: 8000"
echo "- Volúmenes: código sincronizado para desarrollo"
echo "- Cache: habilitado para construcciones futuras"
echo ""
echo "🔧 Comandos útiles:"
echo "- Ver logs: docker logs -f comsigns-backend"
echo "- Reiniciar: docker restart comsigns-backend"
echo "- Entrar al contenedor: docker exec -it comsigns-backend bash"
