/**
 * Barrel de hooks: reexporta hooks modulares
 */
export { useAuthRedirect } from './use-auth-redirect';
export { useRealtimePrediction } from './use-realtime-prediction';
export { useCamera } from './use-camera';
export { useAdvancedCamera } from './use-advanced-camera-v2';
export { useGameCamera } from './use-game-camera';
export { useTranslation } from './use-translation';
export { useBackendConnection } from './use-backend-connection';
export { useGameMode } from './use-game-mode';
export type { GameState, GameProgress, UseGameModeReturn } from './use-game-mode';
// Nota: si persisten errores de resolución, limpiar caché de next (rm -rf .next)
