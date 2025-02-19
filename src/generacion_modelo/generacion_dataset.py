import cv2
import mediapipe as mp
import numpy as np
import time

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)
mp_drawing = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

data = []
labels = []

letters = [chr(i) for i in range(65, 91) if i not in (74, 90)]
print(letters)

try:
    for letter in letters:
        print(f"Press 's' to start collecting data for letter '{letter}'")
        while True:
            ret, frame = cap.read()
            if not ret:
                print("No se puede abrir la cámara.")
                break

            frame = cv2.flip(frame, 1)
            cv2.imshow('Live Feed', frame)

            if cv2.waitKey(1) & 0xFF == ord('s'):
                print(f"Collecting data for letter '{letter}'")
                break

        start_time = time.time()
        duration = 10  
        collected_landmarks = 0  

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(image)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    landmarks = []
                    for lm in hand_landmarks.landmark:
                        landmarks.append([lm.x, lm.y, lm.z])

                    landmarks = np.array(landmarks)
                    landmarks -= landmarks[0]

                    data.append(landmarks.flatten())
                    label_index = letters.index(letter)
                    labels.append(label_index)
                    print(f"Recolección de datos para la letra '{letter}': {label_index}")

                    mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            cv2.imshow('Hand Tracking', frame)

            if time.time() - start_time > duration:
                print(f"Finished collecting data for letter '{letter}'. Collected {collected_landmarks} landmarks.")
                break

            if cv2.waitKey(1) & 0xFF == ord('n'):
                print(f"Finished collecting data for letter '{letter}'. Collected {collected_landmarks} landmarks.")
                break

finally:
    cap.release()
    cv2.destroyAllWindows()

np.save('../dataset/hand_data.npy', np.array(data))
np.save('../dataset/hand_labels.npy', np.array(labels))