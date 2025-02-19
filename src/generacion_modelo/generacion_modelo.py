import os
import cv2
import numpy as np
import mediapipe as mp
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
from tensorflow.keras.callbacks import EarlyStopping

data = np.load('../dataset/hand_data.npy')
labels = np.load('../dataset/hand_labels.npy')

print("Forma de data:", data.shape)
print("Forma de labels:", labels.shape)
print("Valores únicos en labels:", np.unique(labels))

data = data.astype('float32') / np.max(data)

letters = [chr(i) for i in range(65, 91) if i not in (74, 90)]
print("Letras:", letters)

X_train, X_val, y_train, y_val = train_test_split(data, labels, test_size=0.2, random_state=42)

model = keras.Sequential([
    layers.Dense(128, activation='relu', input_shape=(63,)),
    layers.Dropout(0.2),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.2),
    layers.Dense(len(letters), activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

early_stopping = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)

model.fit(X_train, y_train, epochs=50, batch_size=32, validation_data=(X_val, y_val), callbacks=[early_stopping])

model.save('../modelo/model.h5')