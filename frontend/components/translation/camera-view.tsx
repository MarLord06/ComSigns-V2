/**
 * Componente de vista de cámara para captura de video
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Camera } from 'lucide-react';

interface CameraViewProps {
  isActive: boolean;
  onError?: (error: string) => void;
  className?: string;
  width?: number;
  height?: number;
}

export interface CameraViewRef {
  captureFrame: () => Promise<File | null>;
  getVideoElement: () => HTMLVideoElement | null;
}

export const CameraView = forwardRef<CameraViewRef, CameraViewProps>(
  function CameraView({ isActive, onError, className, width = 640, height = 480 }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useImperativeHandle(ref, () => ({
      captureFrame: async (): Promise<File | null> => {
        if (!videoRef.current || !canvasRef.current) {
          return null;
        }

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          return null;
        }

        // Configurar canvas con las dimensiones del video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Dibujar el frame actual del video en el canvas
        context.drawImage(video, 0, 0);

        // Convertir canvas a blob y luego a File
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
              resolve(file);
            } else {
              resolve(null);
            }
          }, 'image/jpeg', 0.8);
        });
      },
      getVideoElement: () => videoRef.current
    }));

    useEffect(() => {
      let isMounted = true;

      const startCamera = async () => {
        try {
          if (!isActive) {
            // Detener cámara si está activa
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
            return;
          }

          // Solicitar acceso a la cámara
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: width },
              height: { ideal: height },
              facingMode: 'user'
            }
          });

          if (!isMounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }

          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          if (onError) {
            onError(`Error accediendo a la cámara: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          }
        }
      };

      startCamera();

      return () => {
        isMounted = false;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
    }, [isActive, width, height, onError]);

    if (!isActive) {
      return (
        <Card className={className}>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Cámara desactivada</p>
              <p className="text-sm">Activa la cámara para comenzar</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto rounded-lg bg-black"
              style={{ aspectRatio: `${width}/${height}` }}
            />
            
            {/* Canvas oculto para captura de frames */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Overlay de estado */}
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded text-xs">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span>EN VIVO</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
