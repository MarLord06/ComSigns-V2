# capturar_landmarks.py
import cv2
import mediapipe as mp
import numpy as np

class CapturaLandmarks:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)
        self.mp_drawing = mp.solutions.drawing_utils
        self.cap = cv2.VideoCapture(1)

    def capturar(self):
        ret, frame = self.cap.read()
        if not ret:
            print("Error al leer el frame.")
            return None, None

        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)

        return frame, results

    def dibujar_landmarks(self, frame, results):
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                self.mp_drawing.draw_landmarks(frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)
                landmarks = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark])
                return landmarks
        return None

    def liberar(self):
        self.cap.release()
        cv2.destroyAllWindows()
