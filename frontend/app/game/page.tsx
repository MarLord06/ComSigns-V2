/**
 * Página de juego refactorizada usando gamificación
 */

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AppLayout, HeroSection } from '@/components/layout'
import { GameLevelCard, StatsCard } from '@/components/shared'
import { useGameMode } from '@/lib/hooks'
import { useAuth } from '@/lib/auth-context'
import { GameLevel } from '@/lib/services/gamification.service'
import { 
  TranslationLayout,
  CameraView,
  TranslationResult,
  ControlPanel,
  CameraViewRef
} from '@/components/translation'
import { useBackendConnection } from '@/lib/hooks'
import { useRealtimePrediction } from '@/lib/hooks/use-realtime-prediction'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  Zap,
  Heart,
  Clock,
  RotateCcw,
  CheckCircle,
  XCircle,
  Star,
  Play,
  Pause,
  Home
} from "lucide-react"

// Tipos de estadísticas del juego
interface GameStats {
  totalScore: number
  gamesPlayed: number
  accuracy: number
  bestStreak: number
  levelsCompleted: number
}

export default function GamePage() {
  // Hook de autenticación para acceder al perfil del usuario
  const { user, profile, stats: userStats } = useAuth();
  
  // Hook principal del juego (conectado al backend)
  const gameMode = useGameMode()
  
  // Estados de la aplicación
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  
  // Referencias
  const cameraRef = useRef<CameraViewRef>(null)
  
  // Sistema de buffer para palabras (SIMPLIFICADO CON CONTROL MANUAL)
  const [wordBuffer, setWordBuffer] = useState<string>('')
  const [bufferTimeout, setBufferTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Referencias para evitar dependencias en useCallback
  const wordBufferRef = useRef<string>('')
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Hooks de cámara y conexión - versión simplificada
  const [currentPrediction, setCurrentPrediction] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(0)
  const [isTranslating, setIsTranslating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isTranslatingRef = useRef(false) // REF PARA EVITAR CLOSURE STALE
  const frameIntervalMs = useRef<number>(1000) // 1 segundo fijo - más simple y confiable
  const lastFrameTime = useRef<number>(0)
  
  // Estado para el sistema inteligente de intervalos
  const [smartInterval, setSmartInterval] = useState(false)
  
  // Timeout de inactividad
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const INACTIVITY_TIMEOUT = 45000 // 45 segundos sin interacción = perder vida
  
  // Hook para conexión realtime
  const { 
    status: realtimeStatus, 
    lastPrediction: realtimePrediction, 
    error: realtimeError, 
    connect: connectRealtime, 
    disconnect: disconnectRealtime, 
    sendFrame 
  } = useRealtimePrediction({ autoConnect: false, log: true })
  
  const { isConnected } = useBackendConnection()
  
  // Estado local para cámara
  const [cameraError, setCameraError] = useState('');

  // ========================================
  // SISTEMA DE BUFFER PARA PALABRAS (MEJORADO)
  // ========================================
  
  const checkWordMatch = useCallback((word: string) => {
    if (!gameMode.currentWord) return;
    
    const targetWord = gameMode.currentWord.toUpperCase();
    const predictedWord = word.toUpperCase();
    
    console.log('[WORD_CHECK] 🔍 Comparando:', predictedWord, 'vs', targetWord);
    console.log('[WORD_CHECK] 📊 Longitudes:', predictedWord.length, 'vs', targetWord.length);
    
    if (predictedWord === targetWord) {
      console.log('[WORD_CHECK] ✅ ¡Palabra correcta!');
      // Registrar intento correcto
      gameMode.recordAttempt(targetWord, predictedWord, true);
      gameMode.processCorrectAnswer(targetWord);
      clearWordBuffer(); // Limpiar buffer al acertar
      // resetInactivityTimer(); // Lo manejaremos en useEffect
    } else if (predictedWord.length === targetWord.length) {
      console.log('[WORD_CHECK] ❌ Palabra incorrecta (longitud completa)');
      // Palabra completa pero incorrecta - perder una vida y limpiar buffer
      // Registrar intento incorrecto
      gameMode.recordAttempt(targetWord, predictedWord, false);
      gameMode.processWrongAnswer(predictedWord);
      clearWordBuffer(); // Limpiar buffer para nuevo intento  
      // resetInactivityTimer(); // Lo manejaremos en useEffect
    } else {
      console.log('[WORD_CHECK] ⏳ Palabra incompleta, continuando...');
      // Palabra incompleta, no hacer nada (continuar recolectando letras)
    }
  }, [gameMode]);
  
  const clearBufferTimeout = useCallback(() => {
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      setBufferTimeout(null);
    }
  }, []);
  
  const clearWordBuffer = useCallback(() => {
    console.log('[BUFFER] 🗑️  Limpiando buffer completo');
    setWordBuffer('');
    clearBufferTimeout();
  }, [clearBufferTimeout]);
  
  // Funciones para manejar timeout de inactividad
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    // Solo establecer timer si el juego está activo
    if (gameMode.gameState === 'playing') {
      inactivityTimeoutRef.current = setTimeout(() => {
        console.log('[INACTIVITY] ⏰ Timeout por inactividad - perdiendo vida');
        // Registrar intento incorrecto por inactividad
        if (gameMode.currentWord) {
          gameMode.recordAttempt(gameMode.currentWord, '', false); // Palabra vacía por inactividad
        }
        gameMode.processWrongAnswer(); // Sin palabra específica
        clearWordBuffer(); // Limpiar buffer
        resetInactivityTimer(); // Reiniciar timer para próxima palabra
      }, INACTIVITY_TIMEOUT);
      
      console.log('[INACTIVITY] 🔄 Timer de inactividad reiniciado -', INACTIVITY_TIMEOUT / 1000, 'segundos');
    }
  }, [gameMode, clearWordBuffer]);
  
  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
      console.log('[INACTIVITY] 🛑 Timer de inactividad detenido');
    }
  }, []);
  
  // Nueva función: Agregar predicción actual al buffer manualmente
  const addToBuffer = useCallback(() => {
    if (currentPrediction && currentPrediction !== '?' && confidence >= 0.7) {
      const newBuffer = wordBuffer + currentPrediction;
      setWordBuffer(newBuffer);
      console.log('[BUFFER] ✅ Letra agregada manualmente:', currentPrediction, 'Buffer:', newBuffer);
      
      // Reiniciar timer de inactividad al agregar letra
      resetInactivityTimer();
      
      // Auto-comparar si el buffer alcanza la longitud objetivo  
      if (gameMode.currentWord && newBuffer.length === gameMode.currentWord.length) {
        setTimeout(() => checkWordMatch(newBuffer), 500);
      }
    }
  }, [currentPrediction, confidence, wordBuffer, gameMode.currentWord, checkWordMatch, resetInactivityTimer]);
  
  
  const sendCurrentBuffer = useCallback(() => {
    const currentBuffer = wordBufferRef.current;
    console.log('[BUFFER] 📤 Enviando buffer manualmente:', currentBuffer);
    if (currentBuffer.length > 0) {
      checkWordMatch(currentBuffer);
    }
  }, [checkWordMatch]);
  
  const startFrameCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastFrame = now - lastFrameTime.current;
      
      console.log('[FRAME_CAPTURE] 📹 Intentando capturar frame...', {
        cameraRef: !!cameraRef.current,
        isTranslating: isTranslatingRef.current,
        captureFrameMethod: !!cameraRef.current?.captureFrame,
        intervalMs: frameIntervalMs.current,
        timeSinceLastFrame
      });
      
      if (cameraRef.current && isTranslatingRef.current) {
        lastFrameTime.current = now;
        
        cameraRef.current.captureFrame().then(file => {
          console.log('[FRAME_CAPTURE] ✅ Frame capturado:', !!file, file ? `${file.size} bytes` : 'null');
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              const base64Data = base64.split(',')[1];
              if (base64Data) {
                console.log('[FRAME_SEND] 📡 Enviando frame al WebSocket:', `${base64Data.length} chars`);
                sendFrame(base64Data);
              } else {
                console.warn('[FRAME_SEND] ⚠️  No se pudo extraer base64Data');
              }
            };
            reader.readAsDataURL(file);
          }
        }).catch(error => {
          console.error('[CAMERA] ❌ Error capturando frame:', error);
        });
      } else {
        console.warn('[FRAME_CAPTURE] ⚠️  No se puede capturar frame:', {
          cameraRef: !!cameraRef.current,
          isTranslating: isTranslatingRef.current
        });
      }
    }, frameIntervalMs.current);
    
    console.log('[FRAME_CAPTURE] ⏱️  Intervalo de captura iniciado con', frameIntervalMs.current, 'ms');
  }, [sendFrame]);
  
  const startRealtimeTranslation = useCallback(async () => {
    console.log('[TRANSLATION] 🚀 startRealtimeTranslation llamado, isTranslating:', isTranslating, 'ref:', isTranslatingRef.current);
    
    if (isTranslating || isTranslatingRef.current) {
      console.log('[TRANSLATION] ⚠️  Ya está traduciendo, saliendo...', {isTranslating, isTranslatingRefCurrent: isTranslatingRef.current});
      return;
    }
    
    console.log('[TRANSLATION] ▶️  Iniciando traducción realtime...');
    
    try {
      console.log('[TRANSLATION] 🎛️  Estableciendo isTranslating = true');
      setIsTranslating(true);
      isTranslatingRef.current = true; // ACTUALIZAR REF TAMBIÉN
      setCameraError('');
      
      // Limpiar estado
      setWordBuffer('');
      setCurrentPrediction('');
      setConfidence(0);
      clearWordBuffer(); // Limpiar sistema de buffer completo
      
      console.log('[TRANSLATION] 🌐 Conectando al servicio realtime...');
      // Conectar al servicio realtime
      await connectRealtime();
      console.log('[TRANSLATION] ✅ Conexión realtime completada');
      
      // Inicializar captura de frames con intervalo fijo
      startFrameCapture();
      
      console.log('[TRANSLATION] ⏱️  Sistema de captura configurado con intervalo fijo de', frameIntervalMs.current, 'ms');
      console.log('[TRANSLATION] 📊 Estado final - isTranslating:', isTranslating, 'ref:', isTranslatingRef.current, 'intervalRef:', !!intervalRef.current);
      console.log('[TRANSLATION] 🎉 Traducción realtime iniciada exitosamente');
      
    } catch (error) {
      console.error('[TRANSLATION] ❌ Error al iniciar traducción:', error);
      setIsTranslating(false);
      isTranslatingRef.current = false;
      setCameraError('Error al conectar con el servicio de traducción');
    }
  }, [isTranslating, connectRealtime, sendFrame, clearWordBuffer, startFrameCapture]);
  
  const stopRealtimeTranslation = useCallback(async () => {
    console.log('[TRANSLATION] 🛑 Deteniendo traducción realtime...', {
      isTranslating, 
      isTranslatingRefCurrent: isTranslatingRef.current,
      hasInterval: !!intervalRef.current
    });
    
    setIsTranslating(false);
    isTranslatingRef.current = false; // ACTUALIZAR REF TAMBIÉN
    
    // Limpiar intervalo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('[TRANSLATION] 🗑️  Intervalo limpiado');
    }
    
    // Limpiar buffer y timeout
    if (bufferTimeout) {
      clearTimeout(bufferTimeout);
      setBufferTimeout(null);
      console.log('[TRANSLATION] 🗑️  Buffer timeout limpiado');
    }
    
    setWordBuffer('');
    setCurrentPrediction('');
    setConfidence(0);
    clearWordBuffer(); // Limpiar sistema de buffer completo
    
    // Desconectar del servicio realtime
    try {
      await disconnectRealtime();
      console.log('[TRANSLATION] ✅ Traducción realtime detenida exitosamente');
    } catch (error) {
      console.error('[TRANSLATION] ❌ Error al desconectar:', error);
    }
  }, [disconnectRealtime, clearWordBuffer]); // Simplificar dependencias

  // ========================================
  // EFECTOS
  // ========================================

  // Log estado del juego para depuración
  useEffect(() => {
    console.log('[GAME] State changed - gameState:', gameMode.gameState, 'currentLevel:', gameMode.currentLevel, 'levels:', gameMode.levels.length)
  }, [gameMode.gameState, gameMode.currentLevel, gameMode.levels])

  // Cargar niveles al montar el componente
  useEffect(() => {
    gameMode.loadLevels()
  }, [])

  // Manejar timer de inactividad (NUEVO)
  useEffect(() => {
    if (gameMode.gameState === 'playing' && gameMode.currentWord) {
      console.log('[INACTIVITY] 🎯 Nueva palabra detectada, iniciando timer de inactividad');
      resetInactivityTimer();
    } else {
      console.log('[INACTIVITY] 🛑 Juego no activo, limpiando timer');
      clearInactivityTimer();
    }
    
    // Cleanup al desmontar
    return () => {
      clearInactivityTimer();
    };
  }, [gameMode.gameState, gameMode.currentWord, resetInactivityTimer, clearInactivityTimer]);

  // Sincronizar ref con estado (NUEVO)
  useEffect(() => {
    isTranslatingRef.current = isTranslating;
  }, [isTranslating]);

  // Sincronizar refs del buffer (NUEVO)
  useEffect(() => {
    wordBufferRef.current = wordBuffer;
  }, [wordBuffer]);

  useEffect(() => {
    bufferTimeoutRef.current = bufferTimeout;
  }, [bufferTimeout]);

  // Procesar predicciones en tiempo real (SIMPLIFICADO - SOLO MOSTRAR)
  useEffect(() => {
    if (!realtimePrediction) return
    
    const letter = realtimePrediction.letter || ''
    const conf = realtimePrediction.confidence || 0
    
    console.log('[PREDICTION] 📡 Letra recibida:', letter, 'Confianza:', conf);
    
    if (conf >= 0.7 && letter && letter !== '?') {
      setCurrentPrediction(letter)
      setConfidence(conf)
      console.log('[PREDICTION] ✅ Predicción válida mostrada:', letter, conf);
    } else {
      setCurrentPrediction('?')
      setConfidence(conf)
      console.log('[PREDICTION] 🤷 Predicción de baja confianza:', letter, conf);
    }
    
    // El sistema de intervalo fijo no necesita ajustes dinámicos
    // Mantiene una captura constante cada segundo
  }, [realtimePrediction, gameMode.gameState]);

  // Finalizar juego cuando no quedan vidas
  useEffect(() => {
    if (gameMode.gameProgress.lives <= 0 && gameMode.gameState === 'playing') {
      gameMode.endGame(false)
    }
  }, [gameMode.gameProgress.lives, gameMode.gameState])

  // Manejar traducción según el estado del juego (CORREGIDO)
  useEffect(() => {
    console.log('[GAME] 🔄 Estado del juego cambió a:', gameMode.gameState, 'isTranslating:', isTranslating, 'currentLevel:', gameMode.currentLevel?.name);
    
    if (gameMode.gameState === 'playing' && !isTranslating) {
      console.log('[GAME] ▶️  Iniciando traducción automáticamente...');
      startRealtimeTranslation();
    } else if (gameMode.gameState === 'paused' && isTranslating) {
      console.log('[GAME] ⏸️  Pausando traducción automáticamente...');
      stopRealtimeTranslation();
    } else if (gameMode.gameState === 'menu' && isTranslating) {
      console.log('[GAME] 🏠 Volviendo al menú, deteniendo traducción...');
      stopRealtimeTranslation();
    }
  }, [gameMode.gameState, isTranslating, startRealtimeTranslation, stopRealtimeTranslation]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    console.log('[GAME] Componente montado - gameState:', gameMode.gameState)
    return () => {
      console.log('[GAME] ⚠️  COMPONENTE DESMONTÁNDOSE - gameState:', gameMode.gameState, 'currentLevel:', gameMode.currentLevel?.name)
      console.trace('[GAME] Stack trace del desmontaje:')
      stopRealtimeTranslation()
      setIsCameraActive(false)
      clearWordBuffer()
    }
  }, []) // SIN DEPENDENCIAS PARA EVITAR RE-RENDERS

  // ========================================
  // HANDLERS
  // ========================================

  const handleLevelSelect = useCallback(async (level: GameLevel) => {
    console.log('[GAME] 🎯 Level selected:', level)
    console.log('[GAME] Before startGame - gameState:', gameMode.gameState, 'currentLevel:', gameMode.currentLevel)
    
    setSelectedLevel(level)
    await gameMode.startGame(level.id)
    
    console.log('[GAME] After startGame - gameState:', gameMode.gameState, 'currentLevel:', gameMode.currentLevel)
    
    setIsCameraActive(true)
    // NO llamar startRealtimeTranslation aquí - deja que el useEffect lo maneje automáticamente
    console.log('[GAME] 📷 Cámara activada, esperando a que useEffect inicie traducción...')
  }, [gameMode])

  const handleBackToMenu = useCallback(() => {
    gameMode.resetGame()
    setIsCameraActive(false)
    stopRealtimeTranslation()
    setSelectedLevel(null)
    clearWordBuffer()
  }, [gameMode, stopRealtimeTranslation, clearWordBuffer])

  const handleGameAction = useCallback((action: 'pause' | 'resume' | 'restart' | 'quit') => {
    switch (action) {
      case 'pause':
        console.log('[GAME] Pausando juego...');
        gameMode.pauseGame();
        if (isTranslating) {
          stopRealtimeTranslation();
        }
        break;
      case 'resume':
        console.log('[GAME] Reanudando juego...');
        gameMode.resumeGame();
        if (!isTranslating && gameMode.gameState !== 'paused') {
          startRealtimeTranslation();
        }
        break;
      case 'restart':
        console.log('[GAME] Reiniciando juego...');
        if (gameMode.currentLevel) {
          gameMode.startGame(gameMode.currentLevel.id);
          // Reiniciar traducción si no está activa
          if (!isTranslating) {
            startRealtimeTranslation();
          }
        }
        break;
      case 'quit':
        console.log('[GAME] Saliendo del juego...');
        handleBackToMenu();
        break;
    }
  }, [gameMode, isTranslating, stopRealtimeTranslation, startRealtimeTranslation, handleBackToMenu]);

  // ========================================
  // ESTADÍSTICAS (obtenidas del perfil real del usuario)
  // ========================================
  
  const stats: GameStats = {
    totalScore: profile?.total_points || 0,
    gamesPlayed: profile?.games_played || 0,
    accuracy: Math.round(profile?.accuracy_percentage || 0),
    bestStreak: profile?.longest_streak || 0,
    levelsCompleted: gameMode.levels.filter((l: any) => l.completed).length
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <AppLayout currentPage="game">
      {/* Debug info */}
      <div className="mb-4 p-2 bg-yellow-100 rounded text-xs">
        Debug: gameState="{gameMode.gameState}" currentLevel={gameMode.currentLevel ? gameMode.currentLevel.name : 'null'} levels={gameMode.levels.length}
        <br />
        Buffer: "{wordBuffer}" ({wordBuffer.length}/{gameMode.currentWord?.length || 0}) 
        | Predicción actual: "{currentPrediction}" ({confidence.toFixed(2)})
      </div>

      {/* PANTALLA INICIAL */}
      {gameMode.gameState === 'menu' && (
        <>
          {/* Hero Section */}
          <HeroSection
            title="🎮 Modo Juego"
            subtitle="Desafía tus habilidades con niveles progresivos"
          />

          {/* Mensaje de error */}
          {gameMode.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{gameMode.error}</p>
            </div>
          )}

          {/* Loading State */}
          {gameMode.isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-gray-600">Cargando niveles...</span>
            </div>
          )}

          {/* Estadísticas del usuario */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">📊 Tus Estadísticas</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatsCard
                title="Puntos Totales"
                value={stats.totalScore.toString()}
                icon={Zap}
              />
              <StatsCard
                title="Partidas"
                value={stats.gamesPlayed.toString()}
                icon={Trophy}
              />
              <StatsCard
                title="Precisión"
                value={`${stats.accuracy}%`}
                icon={CheckCircle}
              />
              <StatsCard
                title="Mejor Racha"
                value={stats.bestStreak.toString()}
                icon={Star}
              />
              <StatsCard
                title="Niveles"
                value={`${stats.levelsCompleted}/${gameMode.levels.length}`}
                icon={Trophy}
              />
            </div>
          </div>

          {/* Selección de niveles */}
          <div>
            <h2 className="text-2xl font-bold mb-4">🎯 Selecciona un Nivel</h2>
            
            {gameMode.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-4" />
                <p className="text-gray-500">Cargando niveles...</p>
              </div>
            ) : gameMode.error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">Error cargando niveles: {gameMode.error}</p>
                <Button onClick={() => gameMode.loadLevels()}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            ) : gameMode.levels.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay niveles disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {gameMode.levels.map((level) => (
                  <GameLevelCard
                    key={level.id}
                    id={level.id}
                    name={level.name}
                    description={level.description}
                    color={level.difficulty === 'easy' ? 'text-green-600' : level.difficulty === 'medium' ? 'text-blue-600' : 'text-red-600'}
                    bgColor={level.difficulty === 'easy' ? 'bg-green-500' : level.difficulty === 'medium' ? 'bg-blue-500' : 'bg-red-500'}
                    unlocked={level.unlocked}
                    completed={level.completed}
                    stars={level.stars}
                    onSelect={() => handleLevelSelect(level)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* PANTALLA DE JUEGO */}
      {(gameMode.gameState === 'playing' || gameMode.gameState === 'paused') && gameMode.currentLevel && (
        <div className="space-y-6">
          {/* Header del juego */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {gameMode.currentLevel.name}
              </Badge>
              <div className="flex items-center space-x-2 text-red-500">
                <Heart size={20} />
                <span className="font-bold">{gameMode.gameProgress.lives}</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-500">
                <Zap size={20} />
                <span className="font-bold">{gameMode.gameProgress.score}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {gameMode.gameState === 'playing' ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGameAction('pause')}
                >
                  <Pause size={16} />
                  Pausar
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGameAction('resume')}
                >
                  <Play size={16} />
                  Reanudar
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleGameAction('quit')}
              >
                <Home size={16} />
                Salir
              </Button>
            </div>
          </div>

          {/* Layout principal - 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Panel izquierdo - Información */}
            <div className="space-y-6">
              {/* Palabra objetivo */}
              <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 shadow-sm">
                <h2 className="text-sm text-gray-600 mb-2">Forma la palabra:</h2>
                <div className="text-4xl md:text-6xl font-bold text-blue-600 tracking-wider">
                  {gameMode.currentWord}
                </div>
                <div className="mt-4 text-gray-500">
                  Palabra {gameMode.gameProgress.currentWordIndex + 1} de {gameMode.currentWords.length}
                </div>
                
                {/* Indicador visual del progreso */}
                {gameMode.currentWord && (
                  <div className="mt-4 flex justify-center">
                    <div className="flex space-x-1">
                      {Array.from(gameMode.currentWord).map((targetLetter, index) => {
                        const userLetter = wordBuffer[index];
                        const isCorrect = userLetter && userLetter.toUpperCase() === targetLetter.toUpperCase();
                        const isEmpty = !userLetter;
                        
                        return (
                          <div
                            key={index}
                            className={`
                              w-8 h-8 border-2 rounded flex items-center justify-center text-sm font-bold
                              ${isEmpty 
                                ? 'border-gray-300 bg-gray-50 text-gray-400' 
                                : isCorrect 
                                  ? 'border-green-500 bg-green-100 text-green-700'
                                  : 'border-red-500 bg-red-100 text-red-700'
                              }
                            `}
                          >
                            {userLetter || targetLetter}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Buffer de palabra actual */}
              <div className="text-center bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-sm text-gray-600 mb-2">Tu palabra:</h3>
                <div className="text-2xl font-bold text-green-600 tracking-wider min-h-[40px]">
                  {wordBuffer || '...'}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {gameMode.currentWord ? (
                    <>
                      {wordBuffer.length}/{gameMode.currentWord.length} letras
                    </>
                  ) : (
                    'Empieza a deletrear'
                  )}
                </div>
                
                {/* Predicción actual y controles */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Predicción actual:</div>
                  <div className="text-xl font-bold text-blue-600 mb-3">
                    {currentPrediction} <span className="text-sm text-gray-500">({(confidence * 100).toFixed(0)}%)</span>
                  </div>
                  
                  {/* Botón para agregar predicción al buffer */}
                  <Button
                    size="sm"
                    variant="default"
                    onClick={addToBuffer}
                    disabled={!currentPrediction || currentPrediction === '?' || confidence < 0.7 || wordBuffer.length >= (gameMode.currentWord?.length || 0)}
                    className="mr-2"
                  >
                    ➕ Agregar "{currentPrediction}"
                  </Button>
                </div>
                
                {/* Controles manuales del buffer */}
                <div className="mt-4 flex justify-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={sendCurrentBuffer}
                    disabled={wordBuffer.length === 0}
                  >
                    📤 Enviar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearWordBuffer}
                    disabled={wordBuffer.length === 0}
                  >
                    🗑️ Limpiar
                  </Button>
                </div>
                
                {/* Indicador de intervalo inteligente */}
                <div className="mt-3 text-center">
                  <div className="text-xs text-gray-500">
                    📏 Intervalo de captura: <span className="font-mono">{frameIntervalMs.current}ms</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {wordBuffer.length > 0 ? '🔄 Activo' : '😴 Idle'}
                  </div>
                </div>
              </div>

              {/* Progreso del nivel (CORREGIDO) */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progreso del nivel</span>
                  <span>{gameMode.gameProgress.correctWords?.length || 0}/{gameMode.currentWords.length}</span>
                </div>
                <Progress 
                  value={gameMode.currentWords.length > 0 ? ((gameMode.gameProgress.correctWords?.length || 0) / gameMode.currentWords.length) * 100 : 0}
                  className="h-3"
                />
              </div>

              {/* Predicción actual */}
              <TranslationResult 
                result={null}
                isProcessing={isCameraActive}
                currentPrediction={currentPrediction}
                confidence={confidence}
              />
            </div>

            {/* Panel derecho - Cámara */}
            <div className="bg-white rounded-lg shadow-sm p-6 relative">
              <h3 className="text-lg font-semibold mb-4">📹 Cámara</h3>
              
              <CameraView 
                ref={cameraRef}
                isActive={isCameraActive}
                className="aspect-video w-full max-w-sm mx-auto"
              />
              
              {/* Controles de cámara */}
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={() => {
                    if (isCameraActive) {
                      setIsCameraActive(false)
                      stopRealtimeTranslation()
                    } else {
                      setIsCameraActive(true)
                      startRealtimeTranslation()
                    }
                  }}
                  variant={isCameraActive ? "outline" : "default"}
                  size="sm"
                >
                  {isCameraActive ? 'Pausar Cámara' : 'Activar Cámara'}
                </Button>
              </div>

              {/* Overlay de pausa */}
              {gameMode.gameState === 'paused' && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-center">
                    <Pause size={48} className="mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">Juego Pausado</h3>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PANTALLA DE GAME OVER */}
      {gameMode.gameState === 'game-over' && (
        <div className="text-center space-y-6">
          <div className="bg-red-50 rounded-xl p-8">
            <XCircle size={64} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-red-600 mb-2">¡Game Over!</h2>
            <p className="text-gray-600">Te quedaste sin vidas</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold mb-4">Resultado Final</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-500">{gameMode.gameProgress.score}</div>
                <div className="text-sm text-gray-600">Puntos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{gameMode.gameProgress.correctWords?.length || 0}</div>
                <div className="text-sm text-gray-600">Palabras Correctas</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={() => gameMode.currentLevel && gameMode.startGame(gameMode.currentLevel.id)}>
              <RotateCcw size={16} className="mr-2" />
              Intentar de Nuevo
            </Button>
            <Button variant="outline" onClick={handleBackToMenu}>
              <Home size={16} className="mr-2" />
              Volver al Menú
            </Button>
          </div>
        </div>
      )}

      {/* PANTALLA DE COMPLETADO */}
      {gameMode.gameState === 'completed' && (
        <div className="text-center space-y-6">
          <div className="bg-green-50 rounded-xl p-8">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-green-600 mb-2">¡Nivel Completado!</h2>
            <p className="text-gray-600">¡Excelente trabajo!</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold mb-4">Resultado Final</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-500">{gameMode.gameProgress.score}</div>
                <div className="text-sm text-gray-600">Puntos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{gameMode.gameProgress.correctWords?.length || 0}</div>
                <div className="text-sm text-gray-600">Correctas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{gameMode.gameProgress.streak}</div>
                <div className="text-sm text-gray-600">Mejor Racha</div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button onClick={handleBackToMenu}>
              <Home size={16} className="mr-2" />
              Volver al Menú
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
