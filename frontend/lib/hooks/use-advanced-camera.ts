/**
 * useAdvancedCamera - Hook refactorizado que usa los nuevos servicios
 * Mantenemos la misma API externa para compatibilidad
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  CameraService, 
  WebSocketService, 
  FrameCaptureService,
  ServiceFactory,
  type CameraPermission,
  type CameraStatus,
  type WebSocketStatus,
  type WebSocketMessage,
  type CapturedFrame
} from '../services';

export interface AdvancedCameraOptions {
  debug?: boolean;
  cameraConstraints?: {
    width?: number;
    height?: number;
    facingMode?: 'user' | 'environment';
  };
  captureOptions?: {
    quality?: number;
    interval?: number;
  };
}

export interface PredictionResult {
  letter: string;
  confidence: number;
  processing_time_ms?: number;
  landmarks_detected?: boolean;
  session_id?: string;
}

export const useAdvancedCamera = (options: AdvancedCameraOptions = {}) => {
  // Estados principales
  const [permission, setPermission] = useState<CameraPermission>('prompt');
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  
  // Estados de predicción
  const [currentPrediction, setCurrentPrediction] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [lastTranslation, setLastTranslation] = useState('');
  const [sessionId, setSessionId] = useState<string>('');

  // Referencias a servicios
  const cameraService = useRef<CameraService | null>(null);
  const wsService = useRef<WebSocketService | null>(null);
  const frameCaptureService = useRef<FrameCaptureService | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Debug logging
  const log = useCallback((prefix: string, ...args: unknown[]) => {
    if (options.debug) {
      console.log(`[${prefix}]`, ...args);
    }
  }, [options.debug]);

  // Manejar mensajes WebSocket
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'session':
        setSessionId((message.session_id as string) || '');
        log('SESSION', 'ID:', message.session_id);
        break;
        
      case 'prediction':
        const prediction: PredictionResult = {
          letter: (message.letter as string) || '',
          confidence: (message.confidence as number) || 0,
          processing_time_ms: message.processing_time_ms as number,
          landmarks_detected: message.landmarks_detected as boolean,
          session_id: message.session_id as string
        };
        
        log('PREDICTION', prediction);
        
        setCurrentPrediction(prediction.letter);
        setConfidence(prediction.confidence);
        
        // Actualizar traducción si la confianza es alta
        if (prediction.confidence > 0.7) {
          setLastTranslation(prev => prev + prediction.letter);
        }
        break;
        
      case 'error':
        log('WS_ERROR', message.message);
        setError((message.message as string) || 'Error desconocido');
        break;
    }
  }, [log]);

  // Inicializar servicios
  useEffect(() => {
    if (!cameraService.current) {
      cameraService.current = ServiceFactory.createCameraService(options.cameraConstraints);
      
      // Configurar callbacks de estado
      const checkStatus = () => {
        const status = cameraService.current?.getStatus() || 'idle';
        const perm = cameraService.current?.getPermission() || 'prompt';
        setCameraStatus(status);
        setPermission(perm);
      };
      
      // Verificar estado inicial
      checkStatus();
    }

    if (!wsService.current) {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      wsService.current = ServiceFactory.createMLWebSocketService(apiBase, options.debug);
      
      // Configurar callbacks WebSocket
      wsService.current.updateCallbacks({
        onOpen: () => {
          log('WS', 'Conectado');
          setWsStatus('connected');
        },
        onClose: () => {
          log('WS', 'Desconectado');
          setWsStatus('disconnected');
        },
        onError: (error) => {
          log('WS', 'Error:', error);
          setWsStatus('error');
        },
        onMessage: (message) => {
          log('WS', 'Mensaje recibido:', message);
          handleWebSocketMessage(message);
        },
        onStatusChange: (status) => {
          setWsStatus(status);
        }
      });
    }

    if (!frameCaptureService.current) {
      frameCaptureService.current = ServiceFactory.createMLFrameCaptureService(options.captureOptions);
    }

    return () => {
      // Cleanup en unmount
      cameraService.current?.cleanup();
      wsService.current?.disconnect();
      frameCaptureService.current?.cleanup();
    };
  }, [options, log, handleWebSocketMessage]);

  // Inicializar cámara
  const initialize = useCallback(async () => {
    if (!cameraService.current || !videoRef.current) {
      setError('Servicios no disponibles');
      return false;
    }

    try {
      setError('');
      setCameraStatus('initializing');
      
      await cameraService.current.initialize();
      cameraService.current.attachToVideo(videoRef.current);
      
      setCameraStatus('active');
      setPermission('granted');
      
      log('CAMERA', 'Inicializada correctamente');
      return true;
      
    } catch (error: unknown) {
      const err = error as Error;
      setCameraStatus('error');
      setPermission('denied');
      setError(err.message || 'Error al inicializar cámara');
      log('CAMERA', 'Error:', error);
      return false;
    }
  }, [log]);

  // Conectar WebSocket
  const connectRealtime = useCallback(async () => {
    if (!wsService.current) return false;

    try {
      await wsService.current.connect();
      return true;
    } catch (error) {
      log('WS', 'Error conectando:', error);
      return false;
    }
  }, [log]);

  // Iniciar traducción en tiempo real
  const startRealtimeTranslation = useCallback(async () => {
    if (isTranslating || !videoRef.current || !frameCaptureService.current) {
      return false;
    }

    log('REALTIME', 'Iniciando traducción');
    
    // Conectar WebSocket
    const connected = await connectRealtime();
    if (!connected) {
      setError('No se pudo conectar al servicio');
      return false;
    }

    // Esperar un poco para que el WebSocket se estabilice
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsTranslating(true);
    setCurrentPrediction('');
    setConfidence(0);
    setError('');

    // Iniciar captura continua con delay inicial
    setTimeout(() => {
      if (frameCaptureService.current && wsService.current?.isConnected()) {
        frameCaptureService.current.startContinuousCapture(
          videoRef.current!,
          (frame: CapturedFrame) => {
            if (wsService.current?.isConnected()) {
              const sent = wsService.current.sendFrame(frame.base64);
              if (options.debug && !sent) {
                log('FRAME', 'Error enviando frame');
              }
            }
          }
        );
      }
    }, 1000); // Esperar 1 segundo antes de empezar a capturar

    return true;
  }, [isTranslating, connectRealtime, log, options.debug]);

  // Detener traducción
  const stopRealtimeTranslation = useCallback(() => {
    if (!isTranslating) return;

    log('REALTIME', 'Deteniendo traducción');
    
    setIsTranslating(false);
    frameCaptureService.current?.stopContinuousCapture();
    wsService.current?.disconnect();
  }, [isTranslating, log]);

  // Capturar frame único
  const captureFrame = useCallback(async (): Promise<File | null> => {
    if (!videoRef.current || !frameCaptureService.current) {
      return null;
    }

    const frame = await frameCaptureService.current.captureFrame(videoRef.current);
    return frame ? new File([frame.blob], 'frame.jpg', { type: 'image/jpeg' }) : null;
  }, []);

  // Limpiar recursos
  const cleanup = useCallback(() => {
    stopRealtimeTranslation();
    cameraService.current?.cleanup();
    setPermission('prompt');
    setCameraStatus('idle');
    setError('');
  }, [stopRealtimeTranslation]);

  // Getters para compatibilidad
  const isSupported = cameraService.current?.isSupported() ?? false;
  const isInitializing = cameraStatus === 'initializing';
  const realtimeStatus = wsStatus;

  return {
    // Referencias
    videoRef,
    
    // Estados
    isSupported,
    permission,
    isInitializing,
    error,
    isTranslating,
    currentPrediction,
    confidence,
    lastTranslation,
    realtimeStatus,
    sessionId,
    
    // Métodos
    initialize,
    cleanup,
    captureFrame,
    startRealtimeTranslation,
    stopRealtimeTranslation,
    
    // Servicios (para uso avanzado)
    services: {
      camera: cameraService.current,
      websocket: wsService.current,
      frameCapture: frameCaptureService.current
    }
  };
};
