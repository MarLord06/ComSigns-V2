/**
 * useGameMode - Hook para manejar el estado del modo juego
 * 🆕 NUEVA ARQUITECTURA: Sistema de registro por lotes (Batch Recording)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createAuthenticatedGamificationService, GameLevel, GameSession, Challenge } from '../services/gamification.service';
import { useAuth } from '../auth-context';
import { getSupabaseAuthHeaders } from '../utils/auth-headers';

export type GameState = 'menu' | 'level-select' | 'playing' | 'paused' | 'game-over' | 'completed';

export interface GameProgress {
  currentWordIndex: number;
  score: number;
  lives: number;
  timeRemaining: number;
  correctWords: string[];
  wrongWords: string[];
  streak: number;
}

export interface UseGameModeReturn {
  // Game State
  gameState: GameState;
  currentLevel: GameLevel | null;
  currentSession: GameSession | null;
  gameProgress: GameProgress;
  
  // Game Data
  levels: GameLevel[];
  currentWords: string[];
  currentWord: string | null;
  currentChallenge: Challenge | null;
  
  // Actions
  loadLevels: () => Promise<void>;
  selectLevel: (levelId: number) => Promise<void>;
  startGame: (levelId: number) => Promise<void>;
  pauseGame: () => void;
  resumeGame: () => void;
  nextWord: () => void;
  processCorrectAnswer: (word: string) => void;
  processWrongAnswer: (word?: string) => void;
  endGame: (completed?: boolean) => Promise<void>;
  resetGame: () => void;
  
  // Loading & Error States
  isLoading: boolean;
  error: string | null;
}

const INITIAL_PROGRESS: GameProgress = {
  currentWordIndex: 0,
  score: 0,
  lives: 5,
  timeRemaining: 30,
  correctWords: [],
  wrongWords: [],
  streak: 0
};

export function useGameMode(): UseGameModeReturn {
  // ========================================
  // CONTEXT & STATE  
  // ========================================
  
  const { user } = useAuth();
  
  // Crear instancia del servicio autenticado
  const gamificationService = createAuthenticatedGamificationService(getSupabaseAuthHeaders);
  
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentLevel, setCurrentLevel] = useState<GameLevel | null>(null);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [gameProgress, setGameProgress] = useState<GameProgress>(INITIAL_PROGRESS);
  
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [currentWords, setCurrentWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 🆕 ACUMULADOR DE INTENTOS - Para registro por lotes
  const pendingAttemptsRef = useRef<Array<{
    targetWord: string;
    predictedWord: string;
    isCorrect: boolean;
    timestamp: number;
    wordIndex: number;
  }>>([]);

  // ========================================
  // TIMER MANAGEMENT
  // ========================================
  
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setGameProgress(prev => {
        if (prev.timeRemaining <= 1) {
          // Time's up!
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ========================================
  // BATCH ATTEMPT RECORDING SYSTEM
  // ========================================
  
  // 🆕 NUEVO: Agregar intento al acumulador (sin enviar al backend)
  const addPendingAttempt = useCallback((targetWord: string, predictedWord: string, isCorrect: boolean) => {
    if (!currentSession) {
      console.warn('[GAME_MODE] No hay sesión activa para acumular intento');
      return;
    }

    const attempt = {
      targetWord,
      predictedWord,
      isCorrect,
      timestamp: Date.now(),
      wordIndex: gameProgress.currentWordIndex
    };

    pendingAttemptsRef.current.push(attempt);
    
    console.log(`[GAME_MODE] 📦 INTENTO ACUMULADO: ${targetWord} → ${predictedWord} (${isCorrect ? '✓' : '✗'})`);
    console.log(`[GAME_MODE] 📋 Total intentos acumulados: ${pendingAttemptsRef.current.length}`);
  }, [currentSession, gameProgress.currentWordIndex]);

  // 🆕 NUEVO: Enviar todos los intentos acumulados al backend
  const submitAllAttempts = useCallback(async () => {
    if (!currentSession || pendingAttemptsRef.current.length === 0 || !user?.id) {
      console.log('[GAME_MODE] 📭 Sin intentos pendientes para enviar o user.id no disponible');
      return;
    }

    const attempts = pendingAttemptsRef.current;
    console.log(`[GAME_MODE] 🚀 ENVIANDO LOTE DE ${attempts.length} INTENTOS AL BACKEND...`);

    try {
      // Enviar todos los intentos como lote
      for (const [index, attempt] of attempts.entries()) {
        console.log(`[GAME_MODE] 📝 Enviando intento ${index + 1}/${attempts.length}: ${attempt.targetWord} → ${attempt.predictedWord}`);
        await gamificationService.recordAttempt({
          session_id: currentSession.session_id,
          user_id: user.id,
          target_letter: attempt.targetWord.charAt(0) || 'A',
          predicted_letter: attempt.predictedWord.charAt(0) || 'A', 
          is_correct: attempt.isCorrect,
          confidence: 0.95,
          time_taken: 1000,
          word_index: attempt.wordIndex,
          target_word: attempt.targetWord,
          predicted_word: attempt.predictedWord
        });
        // Pequeño delay entre requests para evitar saturar el backend
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      console.log(`[GAME_MODE] ✅ TODOS LOS INTENTOS ENVIADOS EXITOSAMENTE (${attempts.length})`);
      // Limpiar acumulador después del envío exitoso
      pendingAttemptsRef.current = [];
    } catch (error) {
      console.error(`[GAME_MODE] ❌ ERROR ENVIANDO LOTE DE INTENTOS:`, error);
      // No limpiar el acumulador en caso de error, para poder reintentar
    }
  }, [currentSession, gamificationService, user?.id]);

  // Stop timer when time runs out
  useEffect(() => {
    if (gameProgress.timeRemaining === 0 && gameState === 'playing') {
      console.log('[GAME_MODE] ⏰ TIMEOUT - Tiempo agotado, procesando como respuesta incorrecta');
      
      // 🛡️ PROTECCIÓN: No procesar timeout si ya no quedan vidas
      if (gameProgress.lives <= 0) {
        console.warn('[GAME_MODE] 🛡️ IGNORANDO timeout - Sin vidas restantes:', gameProgress.lives);
        return;
      }
      
      // 📝 TIMEOUT: Acumular intento incorrecto por tiempo agotado
      if (currentWord && currentSession) {
        addPendingAttempt(currentWord, '', false);
      }
      
      setGameProgress(prev => ({
        ...prev,
        lives: Math.max(0, prev.lives - 1), // 🚨 NUNCA permitir vidas negativas
        streak: 0,
        timeRemaining: currentLevel?.time_limit || 30
      }));
      
      // 🎯 DISPARADOR: Verificar game over por timeout
      const newLives = Math.max(0, gameProgress.lives - 1);
      if (newLives <= 0) {
        console.log('[GAME_MODE] 💀 GAME OVER por timeout - Sin vidas restantes');
        setTimeout(() => setGameState('game-over'), 0);
      }
    }
  }, [gameProgress.timeRemaining, gameState, gameProgress.lives, currentWord, currentLevel, currentSession, addPendingAttempt]);

  // ========================================
  // GAME ACTIONS
  // ========================================
  
  const loadLevels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await gamificationService.getGameLevels();
      setLevels(data.levels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading levels');
    } finally {
      setIsLoading(false);
    }
  }, [gamificationService]);

  const selectLevel = useCallback(async (levelId: number) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) {
      setError('Level not found');
      return;
    }
    
    setCurrentLevel(level);
    setCurrentWords(level.words);
    setGameState('level-select');
  }, [levels]);

  const startGame = useCallback(async (levelId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[GAME_MODE] Starting game with levelId:', levelId);
      
      const level = levels.find(l => l.id === levelId);
      if (!level) {
        console.error('[GAME_MODE] Level not found. Available levels:', levels.map(l => ({ id: l.id, name: l.name })));
        throw new Error(`Level ${levelId} not found`);
      }

      console.log('[GAME_MODE] Found level:', level);

      // Start session in backend with user ID
      const session = await gamificationService.startGameSession(levelId, user?.id);
      
      // 🗑️ Limpiar acumulador para nueva partida
      pendingAttemptsRef.current = [];
      
      // Initialize game state
      setCurrentLevel(level);
      setCurrentSession(session);
      setCurrentWords(level.words);
      setCurrentWord(level.words[0] || null);
      
      setGameProgress({
        ...INITIAL_PROGRESS,
        lives: level.lives,
        timeRemaining: level.time_limit
      });
      
      setGameState('playing');
      startTimer();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error starting game');
    } finally {
      setIsLoading(false);
    }
  }, [levels, startTimer, gamificationService, user?.id]);

  const pauseGame = useCallback(() => {
    if (gameState === 'playing') {
      stopTimer();
      setGameState('paused');
    }
  }, [gameState, stopTimer]);

  const resumeGame = useCallback(() => {
    if (gameState === 'paused') {
      startTimer();
      setGameState('playing');
    }
  }, [gameState, startTimer]);

  const nextWord = useCallback(() => {
    if (!currentWords.length) return;
    
    setGameProgress(prev => {
      const nextIndex = prev.currentWordIndex + 1;
      
      if (nextIndex >= currentWords.length) {
        // Game completed!
        return prev;
      }
      
      return {
        ...prev,
        currentWordIndex: nextIndex,
        timeRemaining: currentLevel?.time_limit || 30 // Reset timer
      };
    });
    
    const nextIndex = gameProgress.currentWordIndex + 1;
    if (nextIndex < currentWords.length) {
      setCurrentWord(currentWords[nextIndex]);
    } else {
      // Game completed - será manejado por endGame
      setTimeout(() => setGameState('completed'), 0);
    }
  }, [currentWords, currentLevel, gameProgress.currentWordIndex]);

  // ========================================
  // GAME LOGIC FUNCTIONS
  // ========================================

  const processCorrectAnswer = useCallback((word: string) => {
    if (!currentLevel || !currentWord) return;
    
    // 🛡️ PROTECCIÓN: No procesar si ya no quedan vidas o juego no está activo
    if (gameProgress.lives <= 0 || gameState !== 'playing') {
      console.warn('[GAME_MODE] 🛡️ IGNORANDO respuesta correcta - Juego inactivo:', { 
        currentLives: gameProgress.lives,
        gameState 
      });
      return;
    }
    
    console.log('[GAME_MODE] 🎯 PROCESANDO RESPUESTA CORRECTA:', { word, currentWord });
    
    // 📝 ACUMULAR INTENTO CORRECTO (sin enviar al backend)
    addPendingAttempt(currentWord, word, true);
    
    // 📊 ACTUALIZAR ESTADO DEL JUEGO
    setGameProgress(prev => ({
      ...prev,
      score: prev.score + (100 * currentLevel.points_multiplier * (prev.streak + 1)),
      correctWords: [...prev.correctWords, word],
      streak: prev.streak + 1
    }));
    
    nextWord();
  }, [currentLevel, currentWord, nextWord, addPendingAttempt, gameProgress.lives, gameState]);

  const processWrongAnswer = useCallback((word?: string) => {
    if (!currentWord) return;
    
    // 🛡️ PROTECCIÓN: No procesar si ya no quedan vidas
    if (gameProgress.lives <= 0) {
      console.warn('[GAME_MODE] 🛡️ IGNORANDO respuesta incorrecta - Sin vidas restantes:', { 
        currentLives: gameProgress.lives,
        gameState 
      });
      return;
    }
    
    console.log('[GAME_MODE] 💥 PROCESANDO RESPUESTA INCORRECTA:', { currentWord, attemptedWord: word });
    
    // 📝 ACUMULAR INTENTO INCORRECTO (sin enviar al backend)
    addPendingAttempt(currentWord, word || '', false);
    
    // 💔 ACTUALIZAR VIDAS - Esta lógica es independiente del registro
    setGameProgress(prev => {
      const newLives = Math.max(0, prev.lives - 1); // 🚨 NUNCA permitir vidas negativas
      const updatedProgress = {
        ...prev,
        lives: newLives,
        streak: 0,
        timeRemaining: currentLevel?.time_limit || 30 // Reset timer
      };
      
      if (word) {
        updatedProgress.wrongWords = [...prev.wrongWords, word];
      }
      
      return updatedProgress;
    });
    
    // 🎯 DISPARADOR: Verificar si el juego debe terminar
    const newLives = Math.max(0, gameProgress.lives - 1);
    console.log('[GAME_MODE] 💔 Vidas después de respuesta incorrecta:', { 
      currentLives: gameProgress.lives, 
      newLives,
      willTriggerGameOver: newLives <= 0
    });
    
    if (newLives <= 0) {
      console.log('[GAME_MODE] 💀 DISPARADOR ACTIVADO - Sin vidas, terminando juego...');
      // Usar setTimeout para evitar dependency issue
      setTimeout(() => {
        console.log('[GAME_MODE] 💀 EJECUTANDO setGameState(game-over)');
        setGameState('game-over');
      }, 0);
    } else {
      nextWord();
    }
  }, [currentLevel, currentWord, gameProgress.lives, nextWord, addPendingAttempt, gameState]);

  const endGame = useCallback(async (completed: boolean = false) => {
    console.log('[GAME_MODE] 🚀 endGame LLAMADO:', { 
      completed, 
      currentState: gameState, 
      currentSession: currentSession?.session_id,
      gameProgress: gameProgress.score
    });
    
    // 🛡️ Protección contra múltiples llamadas - solo verificar si ya se ejecutó completamente
    if (!currentSession) {
      console.warn('[GAME_MODE] 🛡️ IGNORANDO endGame - No hay sesión activa');
      return;
    }
    
    console.log('[GAME_MODE] 🏁 TERMINANDO JUEGO:', { completed, currentState: gameState });
    
    stopTimer();
    
    // 🚀 ENVIAR TODOS LOS INTENTOS ACUMULADOS AL BACKEND PRIMERO
    console.log('[GAME_MODE] 📦 ENVIANDO intentos acumulados...');
    await submitAllAttempts();
    
    try {
      if (!user?.id) {
        console.error('[GAME_MODE] ❌ No user.id disponible para finalizar sesión');
        return;
      }
      console.log('[GAME_MODE] 📝 Finalizando sesión:', currentSession.session_id);
      const response = await gamificationService.endGameSession(
        currentSession.session_id,
        gameProgress.score,
        user.id,
        completed
      );
      console.log('[GAME_MODE] ✅ Sesión finalizada exitosamente:', response);
      // 🗑️ Limpiar sesión después de finalizar exitosamente
      setCurrentSession(null);
    } catch (err) {
      console.error('[GAME_MODE] ❌ Error ending game session:', err);
    }
  }, [stopTimer, currentSession, gameProgress.score, gameState, submitAllAttempts, gamificationService, user?.id]);

  const resetGame = useCallback(() => {
    stopTimer();
    setGameState('menu');
    setCurrentLevel(null);
    setCurrentSession(null);
    setGameProgress(INITIAL_PROGRESS);
    setCurrentWords([]);
    setCurrentWord(null);
    setCurrentChallenge(null);
    setError(null);
    
    // 🗑️ Limpiar acumulador
    pendingAttemptsRef.current = [];
  }, [stopTimer]);

  // ========================================
  // AUTO END GAME WHEN STATE CHANGES
  // ========================================
  
  useEffect(() => {
    console.log('[GAME_MODE] 👀 Monitoreando gameState:', gameState);
    
    // Solo ejecutar endGame cuando cambie A game-over/completed, no cuando ya esté en ese estado
    if ((gameState === 'game-over' || gameState === 'completed') && currentSession) {
      const isCompleted = gameState === 'completed';
      console.log(`[GAME_MODE] 🎮 Estado cambió a ${gameState}, llamando endGame(${isCompleted})...`);
      
      // Ejecutar inmediatamente para evitar múltiples llamadas
      endGame(isCompleted);
    }
  }, [gameState, currentSession]); // Removemos endGame de las dependencias para evitar loops

  // ========================================
  // CLEANUP
  // ========================================
  
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  // ========================================
  // RETURN
  // ========================================
  
  return {
    // Game State
    gameState,
    currentLevel,
    currentSession,
    gameProgress,
    
    // Game Data
    levels,
    currentWords,
    currentWord,
    currentChallenge,
    
    // Actions
    loadLevels,
    selectLevel,
    startGame,
    pauseGame,
    resumeGame,
    nextWord,
    processCorrectAnswer,
    processWrongAnswer,
    endGame,
    resetGame,
    
    // Loading & Error States
    isLoading,
    error
  };
}
