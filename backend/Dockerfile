# Dockerfile para COMSIGNS Backend (FastAPI + Supabase)
FROM python:3.11-slim

# Variables de entorno para optimización
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
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

# Copiar requirements primero para cache
COPY requirements.txt .

# Instalar pip y dependencias base
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Instalar dependencias pesadas (ejemplo ML)
RUN pip install --no-cache-dir \
    tensorflow==2.18.0 \
    keras==3.5.0 \
    numpy==1.26.4 \
    opencv-python==4.8.1.78 \
    mediapipe==0.10.8

# Instalar el resto de dependencias
RUN pip install --no-cache-dir -r requirements.txt



# Crear directorio para modelos y uploads
RUN mkdir -p /app/models /app/uploads

# Copiar el resto del código
COPY . .

# Exponer puerto dinámico para Render
EXPOSE $PORT

# Variables de entorno de runtime
ENV ENVIRONMENT=production

# Comando de inicio (sin reload)
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
