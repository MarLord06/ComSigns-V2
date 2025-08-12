import { useState, useRef, useCallback, useEffect } from 'react';
import { TranslationResponse } from '@/lib/services/translation.service';
import { useRealtimePrediction } from './use-realtime-prediction';
import { CONFIDENCE_THRESHOLDS } from '@/lib/types/realtime';

export function useCamera() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [lastTranslation, setLastTranslation] = useState<TranslationResponse | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { status: realtimeStatus, lastPrediction: realtimePrediction, error: realtimeError, connect: connectRealtime, disconnect: disconnectRealtime, sendFrame } = useRealtimePrediction({ autoConnect: false, log: true });

  useEffect(() => { if (realtimeError) setError(realtimeError); }, [realtimeError]);

  useEffect(() => {
    if (!realtimePrediction) return;
    if (process.env.NEXT_PUBLIC_DEBUG === '1') console.log('[CAM] nueva predicción', realtimePrediction);
    const letter = realtimePrediction.letter || '';
    const conf = realtimePrediction.confidence || 0;
    if (conf >= CONFIDENCE_THRESHOLDS.ACCEPT && letter) {
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
  }, [realtimePrediction]);

  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices);
  }, []);

  const initialize = useCallback(async () => {
    if (!isSupported) { setError('Camera not supported in this browser'); return false; }
    try {
      setIsInitializing(true); setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; }
      setPermission('granted');
      return true;
    } catch (err) {
      const e = err as Error; setError(e.message || 'Camera access failed'); setPermission('denied'); return false;
    } finally { setIsInitializing(false); }
  }, [isSupported]);

  const captureAndSendFrame = useCallback((cameraViewRef?: React.RefObject<any>, forceTranslating = false) => {
    const shouldTranslate = forceTranslating || isTranslating;
    if (process.env.NEXT_PUBLIC_DEBUG === '1') console.debug('[CAM] captureAndSendFrame llamado, isTranslating:', isTranslating, 'forceTranslating:', forceTranslating, 'shouldTranslate:', shouldTranslate);
    if (!shouldTranslate) {
      if (process.env.NEXT_PUBLIC_DEBUG === '1') console.debug('[CAM] No traduciendo, saliendo');
      return;
    }
    if (!cameraViewRef?.current) {
      if (process.env.NEXT_PUBLIC_DEBUG === '1') console.debug('[CAM] Sin cameraViewRef.current, saliendo');
      return;
    }
    try {
      const videoElement = cameraViewRef.current.getVideoElement?.() || videoRef.current;
      if (!videoElement) {
        if (process.env.NEXT_PUBLIC_DEBUG === '1') console.debug('[CAM] Sin videoElement, saliendo');
        return;
      }
      if (videoElement.readyState < 2) {
        if (process.env.NEXT_PUBLIC_DEBUG === '1') console.debug('[CAM] Video no listo, readyState:', videoElement.readyState);
        return;
      }
      if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
      const canvas = canvasRef.current;
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (process.env.NEXT_PUBLIC_DEBUG === '1') console.debug('[CAM] Sin contexto canvas, saliendo');
        return;
      }
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      if (process.env.NEXT_PUBLIC_DEBUG === '1') console.debug('[CAM] frame enviado len=', base64?.length);
      if (base64) sendFrame(base64);
    } catch (e) {
      if (process.env.NEXT_PUBLIC_DEBUG === '1') console.error('[CAM] error capturando frame', e);
    }
  }, [isTranslating, sendFrame]);

  const startRealtimeTranslation = useCallback((cameraViewRef?: React.RefObject<any>) => {
    if (isTranslating) return;
    if (process.env.NEXT_PUBLIC_DEBUG === '1') console.log('[CAM] iniciar realtime, cameraViewRef:', !!cameraViewRef?.current);
    connectRealtime();
    setIsTranslating(true);
    setCurrentPrediction('');
    setConfidence(0);
    intervalRef.current = setInterval(() => {
      if (process.env.NEXT_PUBLIC_DEBUG === '1') console.debug('[CAM] interval tick');
      captureAndSendFrame(cameraViewRef, true); // Pasamos true para forzar la traducción
    }, 200);
    if (process.env.NEXT_PUBLIC_DEBUG === '1') console.log('[CAM] interval iniciado con ID:', intervalRef.current);
  }, [isTranslating, connectRealtime, captureAndSendFrame]);

  const stopRealtimeTranslation = useCallback(() => {
    if (!isTranslating) return;
    if (process.env.NEXT_PUBLIC_DEBUG === '1') console.log('[CAM] detener realtime');
    setIsTranslating(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    disconnectRealtime();
  }, [isTranslating, disconnectRealtime]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const cleanup = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    stopRealtimeTranslation();
    setPermission('prompt'); setError('');
  }, [stopRealtimeTranslation]);

  const captureFrame = useCallback((): Promise<File | null> => {
    if (!videoRef.current) return Promise.resolve(null);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    return new Promise(res => { canvas.toBlob(b => { b ? res(new File([b], 'frame.jpg', { type: 'image/jpeg' })) : res(null); }, 'image/jpeg', 0.8); });
  }, []);

  return { videoRef, isSupported, permission, isInitializing, error, initialize, cleanup, captureFrame, isTranslating, currentPrediction, confidence, lastTranslation, startRealtimeTranslation, stopRealtimeTranslation, realtimeStatus };
}
