import os
import cv2
import numpy as np
import mediapipe as mp
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
from tensorflow.keras.callbacks import EarlyStopping

# Cargar los datos
data = np.load('../dataset/hand_data.npy')
labels = np.load('../dataset/hand_labels.npy')

# Verificar la forma de los datos
print("Forma de data:", data.shape)  # Debería ser (7048, 63)
print("Forma de labels:", labels.shape)  # Debería ser (7048,)
print("Valores únicos en labels:", np.unique(labels))

# Preprocesar los datos
data = data.astype('float32') / np.max(data)  # Normalizar los datos

# Definir las letras
letters = [chr(i) for i in range(65, 91) if i not in (74, 90)]  # A-Z excluyendo J y Z
print("Letras:", letters)

# Asegúrate de que labels ya contenga enteros correspondientes a las letras
# Si labels ya está en el formato correcto, no lo redefinas
# Si necesitas convertir letras a enteros, asegúrate de que sea correcto
# labels = np.array([letters.index(letter) for letter in collected_letters])  # Esto no es necesario aquí

# Dividir los datos en conjuntos de entrenamiento y validación
X_train, X_val, y_train, y_val = train_test_split(data, labels, test_size=0.2, random_state=42)

# Definir la arquitectura del modelo
model = keras.Sequential([
    layers.Dense(128, activation='relu', input_shape=(63,)),
    layers.Dropout(0.2),  # Regularización con Dropout
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.2),  # Regularización con Dropout
    layers.Dense(len(letters), activation='softmax')  # Cambiar a 23 clases para A-Y excluyendo J y Z
])

# Compilar el modelo
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# Configurar EarlyStopping
early_stopping = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)

# Entrenar el modelo
model.fit(X_train, y_train, epochs=50, batch_size=32, validation_data=(X_val, y_val), callbacks=[early_stopping])

# Guardar el modelo
model.save('../modelo/model.h5')