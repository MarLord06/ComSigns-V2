import { useState, useRef, useCallback, useEffect } from 'react';
import { TranslationResponse, translationService } from '@/lib/services/translation.service';
import { mapHttpTranslationResponse } from '@/lib/types/translation';
import type { PredictionBase } from '@/lib/types/realtime';

export function useTranslation() {
  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState<TranslationResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<TranslationResponse[]>([]);
  const [mappedPrediction, setMappedPrediction] = useState<PredictionBase | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const translateFrame = useCallback(async (frame: File) => {
    try {
      setIsProcessing(true);
      setError('');
      const response = await translationService.translateFrame(frame);
      setResult(response);
      const mapped = mapHttpTranslationResponse(response);
      setMappedPrediction(mapped);
      if (response.result && response.result.confidence > 0.7) {
        setHistory(prev => [response, ...prev.slice(0, 9)]);
      }
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
      throw err;
    } finally { setIsProcessing(false); }
  }, []);

  const startRealTimeTranslation = useCallback((captureFrame: () => Promise<File | null>, interval = 1000) => {
    if (isActive) return;
    setIsActive(true);
    intervalRef.current = setInterval(async () => {
      if (!isActive) return;
      const frame = await captureFrame();
      if (frame) { try { await translateFrame(frame); } catch {} }
    }, interval);
  }, [isActive, translateFrame]);

  const stopRealTimeTranslation = useCallback(() => {
    if (!isActive) return;
    setIsActive(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, [isActive]);

  const clearHistory = useCallback(() => { setHistory([]); setMappedPrediction(null); }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { isActive, result, mappedPrediction, error, isProcessing, history, translateFrame, startRealTimeTranslation, stopRealTimeTranslation, clearHistory };
}
