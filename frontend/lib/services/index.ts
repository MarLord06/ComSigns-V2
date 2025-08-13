/**
 * Services Index - Exportaciones centralizadas de todos los servicios
 */

import { CameraService } from './camera.service';
import { WebSocketService } from './websocket.service';
import { FrameCaptureService } from './frame-capture.service';

export { CameraService } from './camera.service';
export type { 
  CameraPermission, 
  CameraStatus, 
  CameraConstraints, 
  CameraError 
} from './camera.service';

export { WebSocketService } from './websocket.service';
export type { 
  WebSocketStatus, 
  WebSocketMessage, 
  WebSocketOptions, 
  WebSocketCallbacks 
} from './websocket.service';

export { FrameCaptureService } from './frame-capture.service';
export type { 
  FrameCaptureOptions, 
  CapturedFrame, 
  FrameStats 
} from './frame-capture.service';

export { RealtimePredictionWS } from './realtime.service';
export type { RealtimeEvents, RealtimeStatus } from './realtime.service';

export { TranslationService, translationService } from './translation.service';
export type { TranslationRequest, TranslationResponse, APIError } from './translation.service';

export { GamificationService, gamificationService } from './gamification.service';
export type { GameLevel, Challenge, GameSession, LeaderboardEntry } from './gamification.service';

/**
 * Factory para crear instancias preconfiguradas de servicios
 */
export class ServiceFactory {
  /**
   * Crea una instancia de CameraService con configuración por defecto
   */
  static createCameraService(overrides?: Partial<import('./camera.service').CameraConstraints>) {
    return new CameraService(overrides);
  }

  /**
   * Crea una instancia de WebSocketService para ML predictions
   */
  static createMLWebSocketService(baseUrl: string, debug: boolean = false) {
    const wsUrl = baseUrl.replace(/^https?:\/\//, 'ws://').replace(/\/$/, '');
    
    return new WebSocketService({
      url: `${wsUrl}/api/v1/ml/predict`,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      debug
    });
  }

  /**
   * Crea una instancia de FrameCaptureService optimizada para ML
   */
  static createMLFrameCaptureService(overrides?: Partial<import('./frame-capture.service').FrameCaptureOptions>) {
    return new FrameCaptureService({
      width: 640,
      height: 480,
      quality: 0.8,
      format: 'jpeg',
      interval: 200,
      enableOptimizations: true,
      ...overrides
    });
  }
}
