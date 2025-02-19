# arduino_com.py
import serial
import time

class ArduinoCom:
    def __init__(self, port):
        self.arduino = None
        try:
            self.arduino = serial.Serial(port, 9600)
            time.sleep(2)
            print("Comunicacion con Arduino establecida.")
        except serial.SerialException as e:
            print(f"Error al conectar con Arduino: {e}")

    def enviar(self, mensaje):
        if self.arduino is not None:
            self.arduino.write(mensaje.encode())
            print(f"Enviando a Arduino: {mensaje}")

    def cerrar(self):
        if self.arduino is not None:
            self.arduino.close()
