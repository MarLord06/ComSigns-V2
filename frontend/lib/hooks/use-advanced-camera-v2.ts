/**
 * useAdvancedCamera - Hook mejorado basado en el hook actual que funciona
 * Mantiene la funcionalidad existente pero con mejor modularización
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { TranslationResponse } from '@/lib/services/translation.service';
import { useRealtimePrediction } from './use-realtime-prediction';
import { CONFIDENCE_THRESHOLDS } from '@/lib/types/realtime';

export interface AdvancedCameraOptions {
  debug?: boolean;
  autoConnect?: boolean;
  confidenceThreshold?: number;
  frameInterval?: number;
  cameraConstraints?: {
    width?: number;
    height?: number;
    facingMode?: 'user' | 'environment';
  };
}

export interface CameraHookResult {
  // Referencias
  videoRef: React.RefObject<HTMLVideoElement | null>;
  
  // Estados de cámara
  isSupported: boolean;
  permission: 'granted' | 'denied' | 'prompt';
  isInitializing: boolean;
  error: string;
  
  // Estados de traducción
  isTranslating: boolean;
  currentPrediction: string;
  confidence: number;
  lastTranslation: TranslationResponse | null;
  realtimeStatus: string;
  
  // Métodos
  initialize: () => Promise<boolean>;
  cleanup: () => void;
  captureFrame: () => Promise<File | null>;
  startRealtimeTranslation: (cameraViewRef?: React.RefObject<{ getVideoElement?: () => HTMLVideoElement }>) => void;
  stopRealtimeTranslation: () => void;
  
  // Nuevas funcionalidades
  getStats: () => CameraStats;
  updateOptions: (newOptions: Partial<AdvancedCameraOptions>) => void;
}

export interface CameraStats {
  totalFramesSent: number;
  successfulPredictions: number;
  averageConfidence: number;
  sessionDuration: number;
  droppedFrames: number;
}

export function useAdvancedCamera(options: AdvancedCameraOptions = {}): CameraHookResult {
  // Configuración con defaults
  const config = useMemo(() => ({
    debug: false,
    autoConnect: false,
    confidenceThreshold: CONFIDENCE_THRESHOLDS.ACCEPT,
    frameInterval: 200,
    cameraConstraints: {
      width: 640,
      height: 480,
      facingMode: 'user' as const
    },
    ...options
  }), [options]);

  // Estados base (igual que el hook original)
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [lastTranslation, setLastTranslation] = useState<TranslationResponse | null>(null);
  
  // Referencias (igual que el hook original)
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Nuevos estados para estadísticas
  const [stats, setStats] = useState<CameraStats>({
    totalFramesSent: 0,
    successfulPredictions: 0,
    averageConfidence: 0,
    sessionDuration: 0,
    droppedFrames: 0
  });
  const sessionStartTime = useRef<number>(Date.now());

  // Hook de predicción en tiempo real (igual que el original)
  const { 
    status: realtimeStatus, 
    lastPrediction: realtimePrediction, 
    error: realtimeError, 
    connect: connectRealtime, 
    disconnect: disconnectRealtime, 
    sendFrame 
  } = useRealtimePrediction({ 
    autoConnect: config.autoConnect, 
    log: config.debug 
  });

  // Debug logging
  const log = useCallback((prefix: string, ...args: unknown[]) => {
    if (config.debug) {
      console.log(`[ADV_CAM_${prefix}]`, ...args);
    }
  }, [config.debug]);

  // Efectos del hook original
  useEffect(() => { 
    if (realtimeError) setError(realtimeError); 
  }, [realtimeError]);

  useEffect(() => {
    if (!realtimePrediction) return;
    
    log('PREDICTION', realtimePrediction);
    
    const letter = realtimePrediction.letter || '';
    const conf = realtimePrediction.confidence || 0;
    
    // Actualizar estadísticas
    setStats(prev => ({
      ...prev,
      totalFramesSent: prev.totalFramesSent + 1,
      successfulPredictions: conf >= config.confidenceThreshold ? prev.successfulPredictions + 1 : prev.successfulPredictions,
      averageConfidence: ((prev.averageConfidence * prev.totalFramesSent) + conf) / (prev.totalFramesSent + 1),
      sessionDuration: Date.now() - sessionStartTime.current
    }));
    
    if (conf >= config.confidenceThreshold && letter) {
      setCurrentPrediction(letter);
    } else if (!letter) {
      setCurrentPrediction('?');
    }
    
    setConfidence(conf);
    setLastTranslation({
      success: true,
      method: 'websocket_prediction',
      result: {
        text: letter || '?',
        confidence: conf,
        processing_time_ms: realtimePrediction.processingTimeMs || 0,
        signs_detected: realtimePrediction.hasLandmarks ? 1 : 0,
        detailed_predictions: []
      }
    });
  }, [realtimePrediction, config.confidenceThreshold, log]);

  useEffect(() => {
    setIsSupported(
      typeof navigator !== 'undefined' && 
      'mediaDevices' in navigator && 
      'getUserMedia' in navigator.mediaDevices
    );
  }, []);

  // Función de inicialización mejorada
  const initialize = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Camera not supported in this browser');
      return false;
    }

    setIsInitializing(true);
    setError('');
    
    try {
      log('INIT', 'Solicitando permisos de cámara...');
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: config.cameraConstraints.width },
          height: { ideal: config.cameraConstraints.height },
          facingMode: config.cameraConstraints.facingMode
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        
        // Esperar a que el video esté listo
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video load error'));
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // Si ya está cargado
          if (video.readyState >= 1) {
            onLoadedMetadata();
          }
        });
        
        // Forzar reproducción
        await videoRef.current.play();
      }
      
      setPermission('granted');
      log('INIT', 'Cámara inicializada correctamente');
      return true;
      
    } catch (error) {
      setPermission('denied');
      let errorMsg = 'Camera initialization failed';
      if (error instanceof Error) {
        errorMsg = error.name === 'NotAllowedError'
          ? 'Camera permission denied'
          : `Camera initialization failed: ${error.message}`;
        log('INIT_ERROR', errorMsg, error);
      } else {
        log('INIT_ERROR', errorMsg);
      }
      setError(errorMsg);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [isSupported, config.cameraConstraints, log]);

  // Función de captura de frame mejorada
  const captureAndSendFrame = useCallback((cameraViewRef?: React.RefObject<{ getVideoElement?: () => HTMLVideoElement }>, forceTranslating = false) => {
    const shouldTranslate = forceTranslating || isTranslating;
    
    if (!shouldTranslate) {
      log('FRAME', 'No traduciendo, saltando frame');
      return;
    }
    
    if (!cameraViewRef?.current) {
      log('FRAME', 'Sin cameraViewRef, usando videoRef directo');
      
      // Fallback: usar videoRef directo
      if (!videoRef.current || videoRef.current.readyState < 2) {
        setStats(prev => ({ ...prev, droppedFrames: prev.droppedFrames + 1 }));
        return;
      }
      
      try {
        if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth || config.cameraConstraints.width || 640;
        canvas.height = video.videoHeight || config.cameraConstraints.height || 480;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        
        if (base64) {
          sendFrame(base64);
          log('FRAME', `Frame enviado desde videoRef (${base64.length} chars)`);
        }
      } catch {
        log('FRAME_ERROR', 'Error capturando desde videoRef');
        setStats(prev => ({ ...prev, droppedFrames: prev.droppedFrames + 1 }));
      }
      return;
    }
    
    // Usar cameraViewRef (comportamiento original)
    try {
      const videoElement = cameraViewRef.current?.getVideoElement?.() || videoRef.current;
      if (!videoElement || videoElement.readyState < 2) {
        setStats(prev => ({ ...prev, droppedFrames: prev.droppedFrames + 1 }));
        return;
      }
      if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
      const canvas = canvasRef.current;
      canvas.width = videoElement.videoWidth || config.cameraConstraints.width || 640;
      canvas.height = videoElement.videoHeight || config.cameraConstraints.height || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      if (base64) {
        sendFrame(base64);
        log('FRAME', `Frame enviado desde cameraViewRef (${base64.length} chars)`);
      }
    } catch {
      log('FRAME_ERROR', 'Error capturando frame');
      setStats(prev => ({ ...prev, droppedFrames: prev.droppedFrames + 1 }));
    }
  }, [isTranslating, sendFrame, config.cameraConstraints, log]);

  // Funciones de traducción (igual que el original pero con mejoras)
  const startRealtimeTranslation = useCallback((cameraViewRef?: React.RefObject<{ getVideoElement?: () => HTMLVideoElement }>) => {
    if (isTranslating) return;
    
    log('RT_START', 'Iniciando traducción en tiempo real');
    sessionStartTime.current = Date.now();
    
    connectRealtime();
    setIsTranslating(true);
    setCurrentPrediction('');
    setConfidence(0);
    
    intervalRef.current = setInterval(() => {
      captureAndSendFrame(cameraViewRef, true);
    }, config.frameInterval);
    
    log('RT_START', `Interval iniciado con ID: ${intervalRef.current}`);
  }, [isTranslating, connectRealtime, captureAndSendFrame, config.frameInterval, log]);

  const stopRealtimeTranslation = useCallback(() => {
    if (!isTranslating) return;
    
    log('RT_STOP', 'Deteniendo traducción');
    setIsTranslating(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    disconnectRealtime();
  }, [isTranslating, disconnectRealtime, log]);

  // Función de limpieza mejorada
  const cleanup = useCallback(() => {
    log('CLEANUP', 'Limpiando recursos');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    stopRealtimeTranslation();
    setPermission('prompt');
    setError('');
    
    // Resetear estadísticas
    setStats({
      totalFramesSent: 0,
      successfulPredictions: 0,
      averageConfidence: 0,
      sessionDuration: 0,
      droppedFrames: 0
    });
  }, [stopRealtimeTranslation, log]);

  // Función de captura de frame individual
  const captureFrame = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], 'frame.jpg', { type: 'image/jpeg' }));
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.8);
    });
  }, []);

  // Nuevas funciones
  const getStats = useCallback((): CameraStats => {
    return {
      ...stats,
      sessionDuration: Date.now() - sessionStartTime.current
    };
  }, [stats]);

  const updateOptions = useCallback((newOptions: Partial<AdvancedCameraOptions>) => {
    Object.assign(config, newOptions);
    log('CONFIG', 'Opciones actualizadas:', newOptions);
  }, [log, config]);

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
    
    // Métodos originales
    initialize,
    cleanup,
    captureFrame,
    startRealtimeTranslation,
    stopRealtimeTranslation,
    
    // Nuevos métodos
    getStats,
    updateOptions
  };
}
