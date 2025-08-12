// Tipos para protocolo WebSocket de predicción en tiempo real

export type SessionMessage = {
  type: 'session';
  session_id: string;
  message: string;
};

export type PredictionMessage = {
  type: 'prediction';
  letter: string; // puede ser '' si no hay detección
  confidence: number; // 0-1
  processing_time_ms: number;
  status: string; // ok | no_hand_detected | error
  landmarks_detected: boolean;
  session_id: string;
};

export type ErrorMessage = {
  type: 'error';
  error: string;
  session_id?: string;
};

export type PongMessage = {
  type: 'pong';
  timestamp?: string | number;
};

export type UnknownMessage = { type: string; [k: string]: any };

export type IncomingRealtimeMessage =
  | SessionMessage
  | PredictionMessage
  | ErrorMessage
  | PongMessage
  | UnknownMessage;

export type OutgoingFrameMessage = {
  type: 'frame';
  image: string; // base64 sin prefijo
  timestamp?: number;
};

export type OutgoingPingMessage = { type: 'ping'; timestamp?: number };

export type OutgoingRealtimeMessage = OutgoingFrameMessage | OutgoingPingMessage;

export interface PredictionBase {
  letter: string;
  confidence: number;
  processingTimeMs: number;
  hasLandmarks: boolean;
  raw?: PredictionMessage;
}

export const CONFIDENCE_THRESHOLDS = {
  ACCEPT: 0.6,
  STRONG: 0.8,
  LOW: 0.4,
} as const;

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export function classifyConfidence(c: number): ConfidenceLevel {
  if (c >= CONFIDENCE_THRESHOLDS.STRONG) return 'high';
  if (c >= CONFIDENCE_THRESHOLDS.ACCEPT) return 'medium';
  return 'low';
}

export function mapPredictionMessage(msg: PredictionMessage): PredictionBase {
  return {
    letter: msg.letter || '',
    confidence: msg.confidence ?? 0,
    processingTimeMs: msg.processing_time_ms ?? 0,
    hasLandmarks: !!msg.landmarks_detected,
    raw: msg,
  };
}
