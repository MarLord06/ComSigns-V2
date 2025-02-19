import cv2
import mediapipe as mp
import numpy as np
import time

# Initialize Mediapipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)
mp_drawing = mp.solutions.drawing_utils

# Initialize video capture
cap = cv2.VideoCapture(0)  # Use 0 for the default camera

# Data collection
data = []
labels = []

# Define the letters to collect data for
letters = [chr(i) for i in range(65, 91) if i not in (74, 90)]  # A-Z excluding J and Z
print(letters)

try:
    for letter in letters:
        print(f"Press 's' to start collecting data for letter '{letter}'")
        
        # Wait for the user to press 's' to start collecting data for the current letter
        while True:
            ret, frame = cap.read()
            if not ret:
                print("No se puede abrir la cámara.")
                break

            # Flip the frame horizontally for a later selfie-view display
            frame = cv2.flip(frame, 1)

            # Display the original frame in a separate window
            cv2.imshow('Live Feed', frame)

            if cv2.waitKey(1) & 0xFF == ord('s'):
                print(f"Collecting data for letter '{letter}'")
                break

        # Start collecting landmarks for a specific duration or until a key is pressed
        start_time = time.time()
        duration = 10  # Duration in seconds to collect data
        collected_landmarks = 0  # Counter for collected landmarks

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Flip the frame horizontally for a later selfie-view display
            frame = cv2.flip(frame, 1)

            # Convert the BGR image to RGB
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Process the image and find hands
            results = hands.process(image)

            # Draw hand landmarks
            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    # Extract landmarks
                    landmarks = []
                    for lm in hand_landmarks.landmark:
                        landmarks.append([lm.x, lm.y, lm.z])

                    # Normalize landmarks
                    landmarks = np.array(landmarks)
                    landmarks -= landmarks[0]  # Normalize based on the first landmark

                    # Append to data
                    data.append(landmarks.flatten())
                    # Use the index of the letter in the letters list as the label
                    label_index = letters.index(letter)  # Get the index of the letter
                    labels.append(label_index)  # Append the index as the label
                    print(f"Recolección de datos para la letra '{letter}': {label_index}")  # Imprimir la etiqueta

                    # Draw landmarks
                    mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            # Display the processed frame with landmarks
            cv2.imshow('Hand Tracking', frame)

            # Check if the duration has passed
            if time.time() - start_time > duration:
                print(f"Finished collecting data for letter '{letter}'. Collected {collected_landmarks} landmarks.")
                break

            # Optionally, allow the user to stop early by pressing 'n'
            if cv2.waitKey(1) & 0xFF == ord('n'):
                print(f"Finished collecting data for letter '{letter}'. Collected {collected_landmarks} landmarks.")
                break

finally:
    cap.release()
    cv2.destroyAllWindows()

# Save the data
np.save('../dataset/hand_data.npy', np.array(data))
np.save('../dataset/hand_labels.npy', np.array(labels))