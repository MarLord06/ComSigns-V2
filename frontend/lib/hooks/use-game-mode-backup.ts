/**
 * useGameMode - Hook para manejar el estado del modo juego
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
  recordAttempt: (targetWord: string, predictedWord: string, isCorrect: boolean) => Promise<void>;
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
  
  // Protección contra registros duplicados
  const lastAttemptRef = useRef<{ word: string; time: number; isCorrect: boolean } | null>(null);
  const attemptCounterRef = useRef(0); // 🆕 Contador para debugging
  const gameActiveRef = useRef(false); // 🆕 Flag de juego activo
  const recordingAttemptRef = useRef(false); // 🆕 Mutex para recordAttempt
  
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
  // ATTEMPT RECORDING - Declared before useEffect
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
    if (!currentSession || pendingAttemptsRef.current.length === 0) {
      console.log('[GAME_MODE] 📭 Sin intentos pendientes para enviar');
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
  }, [currentSession, gamificationService]);

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
  }, []);

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
      console.log('[GAME_MODE] Available levels:', levels);
      
      const level = levels.find(l => l.id === levelId);
      if (!level) {
        console.error('[GAME_MODE] Level not found. Available levels:', levels.map(l => ({ id: l.id, name: l.name })));
        throw new Error(`Level ${levelId} not found`);
      }

      console.log('[GAME_MODE] Found level:', level);

      // Start session in backend with user ID
      const session = await gamificationService.startGameSession(levelId, user?.id);
      
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
      gameActiveRef.current = true; // 🆕 Marcar juego como activo
      startTimer();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error starting game');
    } finally {
      setIsLoading(false);
    }
  }, [levels, startTimer]);

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
      // Game completed
      endGame(true);
    }
  }, [currentWords, currentLevel, gameProgress.currentWordIndex]);

  // ========================================
  // ATTEMPT RECORDING - Now using batch system
  // ========================================

  // 🚫 FUNCIÓN ELIMINADA: recordAttempt - Ahora usamos addPendingAttempt + submitAllAttempts
    if (!currentSession) {
      console.warn('[GAME_MODE] No hay sesión activa para registrar intento');
      return;
    }

    // 🆕 Incrementar contador para debugging
    attemptCounterRef.current += 1;
    const currentAttemptId = attemptCounterRef.current;

    // � MUTEX: Solo permitir un recordAttempt a la vez
    if (recordingAttemptRef.current) {
      console.warn(`[GAME_MODE] 🚨 INTENTO #${currentAttemptId} BLOQUEADO - Ya hay un intento en progreso`);
      return;
    }

    // �🛡️ PROTECCIÓN PRINCIPAL: Verificar flag de juego activo
    if (!gameActiveRef.current) {
      console.warn(`[GAME_MODE] 🛡️ INTENTO #${currentAttemptId} BLOQUEADO - Juego inactivo (flag):`, { 
        gameActive: gameActiveRef.current,
        targetWord, 
        isCorrect 
      });
      return;
    }

    // 🛡️ Protección de estado de juego: no registrar si el juego no está activo o no quedan vidas
    if (gameState !== 'playing') {
      console.warn(`[GAME_MODE] 🛡️ INTENTO #${currentAttemptId} BLOQUEADO - Juego no activo:`, { 
        gameState, 
        targetWord, 
        isCorrect 
      });
      return;
    }
    
    if (gameProgress.lives <= 0) {
      console.warn(`[GAME_MODE] 🛡️ INTENTO #${currentAttemptId} BLOQUEADO - Sin vidas:`, { 
        lives: gameProgress.lives,
        targetWord, 
        isCorrect 
      });
      return;
    }

    // 🛡️ Protección anti-duplicados: evitar registros idénticos en los últimos 5 segundos
    const now = Date.now();
    const lastAttempt = lastAttemptRef.current;
    
    console.log(`[GAME_MODE] � INTENTO #${currentAttemptId}: ${targetWord} → ${predictedWord} (${isCorrect ? '✓' : '✗'})`);
    console.log(`[GAME_MODE] 🔍 Session: ${currentSession.session_id}`);
    
    if (lastAttempt && 
        lastAttempt.word === targetWord && 
        lastAttempt.isCorrect === isCorrect &&
        (now - lastAttempt.time) < 5000) {
      console.warn(`[GAME_MODE] 🛡️ INTENTO #${currentAttemptId} DUPLICADO - IGNORANDO:`, { 
        targetWord, 
        isCorrect,
        timeDiff: now - lastAttempt.time 
      });
      return;
    }

    // 🔒 ACTIVAR MUTEX - Bloquear otros recordAttempt
    recordingAttemptRef.current = true;

    // Actualizar referencia del último intento
    lastAttemptRef.current = { word: targetWord, time: now, isCorrect };

    try {
      console.log(`[GAME_MODE] 📝 ENVIANDO INTENTO #${currentAttemptId} al backend...`);
      
      await gamificationService.recordAttempt({
        session_id: currentSession.session_id,
        target_letter: targetWord.charAt(0) || 'A',
        predicted_letter: predictedWord.charAt(0) || 'A', 
        is_correct: isCorrect,
        confidence: 0.95,
        time_taken: 1000,
        word_index: gameProgress.currentWordIndex,
        target_word: targetWord,
        predicted_word: predictedWord
      });
      
      console.log(`[GAME_MODE] ✅ INTENTO #${currentAttemptId} REGISTRADO exitosamente`);
      
      // 🆕 EXTENDER MUTEX: Mantener bloqueo por 2 segundos adicionales
      setTimeout(() => {
        recordingAttemptRef.current = false;
        console.log(`[GAME_MODE] 🔓 MUTEX LIBERADO para INTENTO #${currentAttemptId} después de delay`);
      }, 2000);
      
    } catch (error) {
      console.error(`[GAME_MODE] ❌ ERROR en INTENTO #${currentAttemptId}:`, error);
      // 🔓 LIBERAR MUTEX en caso de error también
      recordingAttemptRef.current = false;
    }
  }, [currentSession, gameProgress.currentWordIndex, gamificationService]);

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
    if (newLives <= 0) {
      console.log('[GAME_MODE] 💀 DISPARADOR ACTIVADO - Sin vidas, terminando juego...');
      // Usar setTimeout para evitar dependency issue
      setTimeout(() => endGame(false), 0);
    } else {
      nextWord();
    }
  }, [currentLevel, currentWord, gameProgress.lives, nextWord, addPendingAttempt, gameState]);

  const endGame = useCallback(async (completed: boolean = false) => {
    // 🛡️ Protección contra múltiples llamadas
    if (gameState === 'game-over' || gameState === 'completed') {
      console.warn('[GAME_MODE] 🛡️ IGNORANDO endGame - Juego ya terminado:', gameState);
      return;
    }
    
    console.log('[GAME_MODE] 🏁 TERMINANDO JUEGO:', { completed, currentState: gameState });
    
    // 🆕 Marcar juego como inactivo INMEDIATAMENTE
    gameActiveRef.current = false;
    
    stopTimer();
    
    // 🎯 Cambiar estado PRIMERO para prevenir más llamadas
    setGameState(completed ? 'completed' : 'game-over');
    
    // 🚀 ENVIAR TODOS LOS INTENTOS ACUMULADOS AL BACKEND
    await submitAllAttempts();
    
    if (currentSession) {
      try {
        console.log('[GAME_MODE] 📝 Finalizando sesión:', currentSession.session_id);
        await gamificationService.endGameSession(
          currentSession.session_id,
          gameProgress.score,
          completed
        );
        console.log('[GAME_MODE] ✅ Sesión finalizada exitosamente');
      } catch (err) {
        console.error('[GAME_MODE] ❌ Error ending game session:', err);
      }
    }
  }, [stopTimer, currentSession, gameProgress.score, gameState, submitAllAttempts]);

  const resetGame = useCallback(() => {
    // 🆕 Marcar juego como inactivo
    gameActiveRef.current = false;
    
    // 🔓 Liberar mutex por si acaso  
    recordingAttemptRef.current = false;
    
    stopTimer();
    setGameState('menu');
    setCurrentLevel(null);
    setCurrentSession(null);
    setGameProgress(INITIAL_PROGRESS);
    setCurrentWords([]);
    setCurrentWord(null);
    setCurrentChallenge(null);
    setError(null);
  }, [stopTimer]);

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
    recordAttempt,
    endGame,
    resetGame,
    
    // Loading & Error States
    isLoading,
    error
  };
}
