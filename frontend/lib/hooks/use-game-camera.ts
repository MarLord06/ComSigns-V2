/**
 * useGameCamera - Extensión especializada para el modo juego
 * Basada en useAdvancedCamera-v2 con funcionalidades específicas de juego
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAdvancedCamera, type AdvancedCameraOptions } from './use-advanced-camera-v2';

export interface GameCameraOptions extends AdvancedCameraOptions {
  gameMode?: boolean;
  wordTarget?: string;
  timeLimit?: number;
  confidenceThreshold?: number;
}

export interface GamePrediction {
  letter: string;
  confidence: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface GameStats {
  correctPredictions: number;
  totalAttempts: number;
  accuracy: number;
  averageTime: number;
  currentStreak: number;
  bestStreak: number;
}

export function useGameCamera(options: GameCameraOptions = {}) {
  // Base camera functionality
  const camera = useAdvancedCamera({
    debug: true,
    frameInterval: 150, // Más rápido para juegos
    confidenceThreshold: 0.8, // Más estricto para juegos
    ...options
  });

  // Game-specific states
  const [currentTarget, setCurrentTarget] = useState(options.wordTarget || '');
  const [gameStats, setGameStats] = useState<GameStats>({
    correctPredictions: 0,
    totalAttempts: 0,
    accuracy: 0,
    averageTime: 0,
    currentStreak: 0,
    bestStreak: 0
  });
  
  const [gamePredictions, setGamePredictions] = useState<GamePrediction[]>([]);
  const [isWaitingForPrediction, setIsWaitingForPrediction] = useState(false);
  const targetStartTime = useRef<number>(0);

  // Game-specific callbacks
  const onCorrectPrediction = useCallback((callback?: (prediction: GamePrediction) => void) => {
    return (prediction: GamePrediction) => {
      if (prediction.isCorrect) {
        setGameStats(prev => ({
          ...prev,
          correctPredictions: prev.correctPredictions + 1,
          currentStreak: prev.currentStreak + 1,
          bestStreak: Math.max(prev.bestStreak, prev.currentStreak + 1)
        }));
        callback?.(prediction);
      } else {
        setGameStats(prev => ({
          ...prev,
          currentStreak: 0
        }));
      }
    };
  }, []);

  const onPredictionComplete = useCallback((callback?: (prediction: GamePrediction) => void) => {
    return (prediction: GamePrediction) => {
      const completionTime = Date.now() - targetStartTime.current;
      
      setGameStats(prev => {
        const newTotal = prev.totalAttempts + 1;
        const newAccuracy = ((prev.accuracy * prev.totalAttempts) + (prediction.isCorrect ? 1 : 0)) / newTotal;
        const newAverageTime = ((prev.averageTime * prev.totalAttempts) + completionTime) / newTotal;
        
        return {
          ...prev,
          totalAttempts: newTotal,
          accuracy: newAccuracy,
          averageTime: newAverageTime
        };
      });
      
      callback?.(prediction);
    };
  }, []);

  // Enhanced prediction processing for games
  useEffect(() => {
    if (!camera.currentPrediction || !currentTarget || !isWaitingForPrediction) return;
    
    const prediction: GamePrediction = {
      letter: camera.currentPrediction,
      confidence: camera.confidence,
      isCorrect: camera.currentPrediction.toLowerCase() === currentTarget.toLowerCase(),
      timestamp: Date.now()
    };
    
    setGamePredictions(prev => [...prev.slice(-9), prediction]); // Keep last 10 predictions
    setIsWaitingForPrediction(false);
    
    // Auto-trigger callbacks based on game state
    onPredictionComplete()(prediction);
    if (prediction.isCorrect) {
      onCorrectPrediction()(prediction);
    }
  }, [camera.currentPrediction, camera.confidence, currentTarget, isWaitingForPrediction, onCorrectPrediction, onPredictionComplete]);

  // Game-specific methods
  const startGameSession = useCallback((target: string) => {
    setCurrentTarget(target);
    setIsWaitingForPrediction(true);
    targetStartTime.current = Date.now();
    
    // Start camera if not already started
    if (!camera.isTranslating) {
      camera.startRealtimeTranslation();
    }
  }, [camera]);

  const endGameSession = useCallback(() => {
    setIsWaitingForPrediction(false);
    setCurrentTarget('');
    camera.stopRealtimeTranslation();
  }, [camera]);

  const nextTarget = useCallback((newTarget: string) => {
    setCurrentTarget(newTarget);
    setIsWaitingForPrediction(true);
    targetStartTime.current = Date.now();
  }, []);

  const resetGameStats = useCallback(() => {
    setGameStats({
      correctPredictions: 0,
      totalAttempts: 0,
      accuracy: 0,
      averageTime: 0,
      currentStreak: 0,
      bestStreak: 0
    });
    setGamePredictions([]);
  }, []);

  return {
    // Include all base camera functionality
    ...camera,
    
    // Game-specific states
    currentTarget,
    gameStats,
    gamePredictions,
    isWaitingForPrediction,
    
    // Game-specific methods
    startGameSession,
    endGameSession,
    nextTarget,
    resetGameStats,
    onCorrectPrediction,
    onPredictionComplete,
    
    // Enhanced getStats that includes game stats
    getStats: useCallback(() => ({
      ...camera.getStats(),
      game: gameStats
    }), [camera, gameStats])
  };
}
