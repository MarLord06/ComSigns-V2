// Tipos y helpers para unificar predicciones HTTP y Realtime
import { PredictionBase } from './realtime';
import type { TranslationResponse } from '@/lib/services/translation.service';

export interface HttpPredictionRaw extends TranslationResponse {}

export function mapHttpTranslationResponse(resp: TranslationResponse): PredictionBase | null {
  if (!resp || !resp.result) return null;
  return {
    letter: resp.result.text || '',
    confidence: resp.result.confidence ?? 0,
    processingTimeMs: resp.result.processing_time_ms ?? 0,
    hasLandmarks: (resp.result.signs_detected ?? 0) > 0,
    raw: undefined as any // raw sólo para realtime; se podría ampliar si es necesario
  };
}
