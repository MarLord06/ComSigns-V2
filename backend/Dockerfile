# Dockerfile optimizado para el backend de COMSIGNS
FROM python:3.11-slim

# Configurar variables de entorno para optimización
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema en una sola capa optimizada
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgstreamer1.0-0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/*

# Copiar solo requirements primero para mejor cache
COPY requirements.txt .

# Separar instalación de dependencias en capas para mejor cache
# Instalar dependencias base primero
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Instalar dependencias pesadas por separado para mejor cache
RUN pip install --no-cache-dir \
    tensorflow==2.18.0 \
    keras==3.5.0 \
    numpy==1.26.4 \
    opencv-python==4.8.1.78 \
    mediapipe==0.10.8

# Instalar el resto de dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Crear directorio para modelos
RUN mkdir -p /app/models

# Copiar código de la aplicación al final
COPY . .

# Exponer puerto
EXPOSE 8000

# Variables de entorno de runtime
ENV ENVIRONMENT=development

# Comando por defecto
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
