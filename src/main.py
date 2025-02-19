# main.py
import cv2
import numpy as np

from modules.capturar_landmarks import CapturaLandmarks
from modules.arduino_com import ArduinoCom
from modules.funcioness_modelo import Modelo

def main():
    # Inicializar componentes
    captura = CapturaLandmarks()
    arduino = ArduinoCom('/dev/cu.usbmodem11301')  
    modelo = Modelo("../modelo/model.h5")
    palabra = ""

    # Crear una guía visual
    guia_visual = np.zeros((50, 1280, 3), dtype=np.uint8)
    cv2.putText(guia_visual, "q: exit", (200, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(guia_visual, "s: Aceptar prediccion", (400, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(guia_visual, "y: Enviar palabra", (600, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(guia_visual, "Delete: Borrar prediccion", (800, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    while True:
        frame, results = captura.capturar()
        key = cv2.waitKey(1) & 0xFF

        if frame is None:
            break

        landmarks = captura.dibujar_landmarks(frame, results)

        if landmarks is not None:
            predicted_letter = modelo.predecir(landmarks)

            cv2.putText(frame, f'Prediccion: {predicted_letter}', (10, 30),
                        cv2.FONT_HERSHEY_DUPLEX, 1, (0, 255, 0), 1, cv2.LINE_AA)

            if key == 32:  # Espacio
                palabra += " "
                print(f"Palabra actual: {palabra}")

            if key == ord('s'):
                palabra += predicted_letter
                print(f"Palabra actual: {palabra}")


        cv2.putText(frame, f'Palabra: {palabra}', (10, 60),
                    cv2.FONT_HERSHEY_DUPLEX, 1, (255, 0, 0), 1, cv2.LINE_AA)

        frame[frame.shape[0] - guia_visual.shape[0]:, :] = guia_visual
        cv2.imshow("Reconocimiento de Señales", frame)

        if key == ord('y'):
            arduino.enviar(palabra)
            palabra = ""

        if key == ord('q'):
            break

        if key == 127:  # Delete
            palabra = palabra[:-1]


    captura.liberar()
    arduino.cerrar()

if __name__ == "__main__":
    main()
