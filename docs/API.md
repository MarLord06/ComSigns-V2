# COMSIGNS API v2.0 - Documentación

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose instalados
- Puerto 8000, 5432, 6379 y 8080 disponibles

### Iniciar el desarrollo
```bash
# Clonar el proyecto
git clone https://github.com/MarLord06/COMSIGNS.git
cd COMSIGNS

# Iniciar servicios
./start-dev.sh
```

### Acceder a la API
- **API:** http://localhost:8000
- **Documentación interactiva:** http://localhost:8000/docs
- **Redoc:** http://localhost:8000/redoc

## 📋 Endpoints Principales

### Machine Learning
- `GET /api/v1/ml/model/info` - Información del modelo
- `POST /api/v1/ml/predict` - Predicción de letra (base64)
- `POST /api/v1/ml/predict/upload` - Predicción de letra (archivo)

### Tutorial Interactivo
- `GET /api/v1/ml/tutorial/overview` - Resumen del tutorial
- `GET /api/v1/ml/tutorial/step/{step}` - Paso específico del tutorial
- `POST /api/v1/ml/tutorial/progress` - Actualizar progreso

### Modo Práctica
- `POST /api/v1/ml/practice/session` - Crear sesión de práctica
- `POST /api/v1/ml/practice/result` - Enviar resultados
- `GET /api/v1/ml/practice/leaderboard` - Tabla de clasificación

## 🏗 Arquitectura

### Estructura del Backend
```
backend/
├── app/
│   ├── main.py                 # Aplicación principal
│   ├── core/                   # Configuración y utilidades
│   │   ├── config.py
│   │   ├── supabase.py         # Cliente Supabase
│   │   ├── middleware.py
│   │   └── exceptions.py
│   ├── modules/               # Módulos de funcionalidad
│   │   └── ml/               # Módulo Machine Learning
│   │       ├── schemas.py    # Schemas Pydantic
│   │       ├── services.py   # Lógica de negocio
│   │       └── routes.py     # Endpoints FastAPI
│   └── api/                  # Routers de API
│       └── v1/
│           └── api.py
├── requirements.txt
├── Dockerfile
└── .env.example
```

### Servicios Docker
- **backend**: API FastAPI con Supabase
- **redis**: Cache y sesiones
- **adminer**: Interfaz web para BD

## 🔧 Configuración

### Variables de Entorno (.env)
```bash
# Entorno
ENVIRONMENT=development

# Supabase
SUPABASE_URL=https://xqdlbbwavnmkewvjaget.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_URL=redis://localhost:6379/0

# Seguridad
SECRET_KEY=your-secret-key-here
CONFIDENCE_THRESHOLD=0.65

# Modelo ML
MODEL_PATH=../modelo/model.h5
```

## 🧠 Machine Learning

### Modelo Actual
- **Framework**: TensorFlow 2.x
- **Tipo**: Clasificación de letras del alfabeto ecuatoriano
- **Input**: Landmarks de MediaPipe (21 puntos x 3 coordenadas)
- **Output**: 24 letras (A-Y excluyendo J y Z)

### Pipeline de Predicción
1. **Recepción de imagen** (base64 o archivo)
2. **Extracción de landmarks** con MediaPipe
3. **Normalización** de coordenadas
4. **Predicción** con modelo TensorFlow
5. **Validación** de confianza
6. **Respuesta** con letra y metadatos

## 🎯 Tutorial Interactivo

### Características
- **24 pasos** (una letra por paso)
- **Orden pedagógico** (fácil → difícil)
- **Consejos específicos** por letra
- **Progreso persistente**

### Flujo del Tutorial
1. Usuario accede al tutorial
2. Sistema muestra paso actual
3. Usuario practica la seña
4. Sistema valida con predicción ML
5. Progreso se guarda automáticamente

## 🏆 Modo Práctica

### Niveles de Dificultad
- **Principiante**: 8 letras, 10s por letra, 70% confianza
- **Intermedio**: 8 letras, 8s por letra, 75% confianza  
- **Avanzado**: 8 letras, 6s por letra, 80% confianza

### Sistema de Puntuación
- **Base**: 100 puntos por letra correcta
- **Bonus**: Multiplicador por confianza
- **Penalty**: Reducción por tiempo

## 🔒 Seguridad

### Headers de Seguridad
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy configurado

### Validación de Datos
- **Pydantic** para validación automática
- **Límites de tamaño** para imágenes
- **Sanitización** de inputs

## 📊 Monitoreo

### Logs Estructurados
- **Request/Response** logging
- **Tiempo de procesamiento**
- **Errores detallados**

### Métricas Disponibles
- Tiempo de predicción promedio
- Precisión por letra
- Uso de recursos del modelo

## 🧪 Testing

### Ejecutar Tests
```bash
# Dentro del contenedor
docker exec -it comsigns-backend pytest

# Con coverage
docker exec -it comsigns-backend pytest --cov=app tests/
```

### Estructura de Tests
```
tests/
├── test_ml/
│   ├── test_services.py
│   ├── test_routes.py
│   └── test_models.py
├── test_core/
│   └── test_config.py
└── conftest.py
```

## 🚀 Despliegue

### Variables de Producción
```bash
ENVIRONMENT=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
SECRET_KEY=super-secret-production-key
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Recursos Adicionales

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **TensorFlow**: https://tensorflow.org/
- **MediaPipe**: https://mediapipe.dev/
- **PostgreSQL**: https://postgresql.org/

---

**Desarrollado con ❤️ para la comunidad sordomuda**
