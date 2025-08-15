import { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimePredictionWS, RealtimeStatus } from '@/lib/services/realtime.service';
import { PredictionBase } from '@/lib/types/realtime';

interface UseRealtimePredictionOptions {
  autoConnect?: boolean;
  log?: boolean;
}

export function useRealtimePrediction(opts: UseRealtimePredictionOptions = {}) {
  const serviceRef = useRef<RealtimePredictionWS | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const [lastPrediction, setLastPrediction] = useState<PredictionBase | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnectInfo, setReconnectInfo] = useState<{ attempt: number; delayMs: number } | null>(null);

  // Crear callback estable para manejar predicciones
  const handlePrediction = useCallback((p: PredictionBase) => {
    if (opts.log) console.log('[RT] prediction', p);
    setLastPrediction(prev => {
      // Solo actualizar si hay cambios significativos para evitar re-renders innecesarios
      if (!prev || prev.letter !== p.letter || Math.abs((prev.confidence || 0) - (p.confidence || 0)) > 0.01) {
        return p;
      }
      return prev;
    });
  }, [opts.log]);

  if (!serviceRef.current) {
    serviceRef.current = new RealtimePredictionWS({ log: opts.log });
  }

  const connect = useCallback(() => {
    serviceRef.current?.connect();
  }, []);
  const disconnect = useCallback(() => {
    serviceRef.current?.close();
    setStatus('idle');
  }, []);
  const sendFrame = useCallback((base64: string) => {
    serviceRef.current?.sendFrame(base64);
  }, []);

  useEffect(() => {
    const svc = serviceRef.current!;
    const offOpen = svc.on('open', () => { if (opts.log) console.log('[RT] open'); setStatus('open'); setError(null); });
    const offClose = svc.on('close', () => { if (opts.log) console.log('[RT] close'); setStatus('idle'); });
    const offErr = svc.on('error', (e) => { if (opts.log) console.error('[RT] error', e); setError(typeof e === 'string' ? e : 'Realtime error'); setStatus('error'); });
    const offSess = svc.on('session', id => { if (opts.log) console.log('[RT] session', id); setSessionId(id); });
    const offPred = svc.on('prediction', handlePrediction);
    const offReconnect = svc.on('reconnect', (attempt, delayMs) => { if (opts.log) console.warn('[RT] reconnect', { attempt, delayMs }); setStatus('reconnecting'); setReconnectInfo({ attempt, delayMs }); });
    const offRaw = svc.on('raw', msg => { if (opts.log) console.debug('[RT] raw', msg); });

    if (opts.autoConnect) connect();
    return () => { offOpen(); offClose(); offErr(); offSess(); offPred(); offReconnect(); offRaw(); };
  }, [opts.autoConnect, handlePrediction, opts.log]);

  return {
    status,
    lastPrediction,
    sessionId,
    error,
    reconnectInfo,
    connect,
    disconnect,
    sendFrame,
  };
}
