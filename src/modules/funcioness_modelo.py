# funciones_modelo.py
import numpy as np
from tensorflow.keras.models import load_model

class Modelo:
    def __init__(self, model_path):
        self.model = load_model(model_path)
        self.letters = [chr(i) for i in range(65, 91) if i not in (74, 90)]  # A-Z excluyendo J y Z

    def predecir(self, landmarks):
        landmarks = np.array(landmarks)
        landmarks -= landmarks[0]  # Normalizar basado en el primer landmark

        if landmarks.shape[0] != 21:
            raise ValueError(f"Expected 21 landmarks, but got {landmarks.shape[0]} landmarks.")

        features = landmarks.flatten()
        features = np.expand_dims(features, axis=0)

        out = self.model.predict(features)
        pred = np.argmax(out, axis=1)
        confidence = np.max(out)

        threshold = 0.65
        if confidence < threshold:
            print("Desconocido")
            return ""
        else:
            if len(pred) > 0 and pred[0] < len(self.letters):
                print(f"Prediccion: {self.letters[pred[0]]} (Confianza: {confidence})")
                return self.letters[pred[0]]
            else:
                print("Prediccion fuera de rango.")
                return "Desconocido"
