/**
 * Página de juego refactorizada usando componentes modulares
 */

"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { AppLayout, HeroSection } from '@/components/layout'
import { GameLevelCard, StatsCard } from '@/components/shared'
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
  Star
} from "lucide-react"

// Definición de niveles
interface GameLevel {
  id: number
  name: string
  description: string
  color: string
  bgColor: string
  unlocked: boolean
  completed: boolean
  stars: number
  wordsLength: [number, number] // [min, max] longitud de palabras
  timeLimit: number // segundos por palabra
  lives: number
  pointsMultiplier: number
}

const GAME_LEVELS: GameLevel[] = [
  {
    id: 1,
    name: "Principiante",
    description: "Palabras simples de 2-3 letras",
    color: "text-green-600",
    bgColor: "bg-green-500",
    unlocked: true,
    completed: true,
    stars: 3,
    wordsLength: [2, 3],
    timeLimit: 15,
    lives: 5,
    pointsMultiplier: 1,
  },
  {
    id: 2,
    name: "Intermedio",
    description: "Palabras de 4-5 letras",
    color: "text-blue-600",
    bgColor: "bg-blue-500",
    unlocked: true,
    completed: false,
    stars: 0,
    wordsLength: [4, 5],
    timeLimit: 20,
    lives: 4,
    pointsMultiplier: 2,
  },
  {
    id: 3,
    name: "Avanzado",
    description: "Palabras complejas de 6-7 letras",
    color: "text-purple-600",
    bgColor: "bg-purple-500",
    unlocked: false,
    completed: false,
    stars: 0,
    wordsLength: [6, 7],
    timeLimit: 25,
    lives: 3,
    pointsMultiplier: 3,
  },
  {
    id: 4,
    name: "Experto",
    description: "Palabras muy difíciles de 8+ letras",
    color: "text-red-600",
    bgColor: "bg-red-500",
    unlocked: false,
    completed: false,
    stars: 0,
    wordsLength: [8, 12],
    timeLimit: 30,
    lives: 2,
    pointsMultiplier: 5,
  },
]

interface GameStats {
  totalScore: number
  gamesPlayed: number
  accuracy: number
  bestStreak: number
  levelsCompleted: number
}

export default function GamePage() {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'finished'>('menu')
  const [currentWord, setCurrentWord] = useState("")
  const [lives, setLives] = useState(5)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)

  const stats: GameStats = {
    totalScore: 1250,
    gamesPlayed: 23,
    accuracy: 87,
    bestStreak: 12,
    levelsCompleted: GAME_LEVELS.filter(l => l.completed).length
  }

  const handleLevelSelect = (level: GameLevel) => {
    if (level.unlocked) {
      setSelectedLevel(level)
      setGameState('playing')
      setLives(level.lives)
      setScore(0)
      setTimeLeft(level.timeLimit)
      setCurrentWord("HOLA") // Palabra de ejemplo
    }
  }

  const handleBackToMenu = () => {
    setSelectedLevel(null)
    setGameState('menu')
  }

  const handleGameAction = (action: 'pause' | 'resume' | 'restart' | 'quit') => {
    switch (action) {
      case 'pause':
        setGameState('paused')
        break
      case 'resume':
        setGameState('playing')
        break
      case 'restart':
        if (selectedLevel) {
          setLives(selectedLevel.lives)
          setScore(0)
          setTimeLeft(selectedLevel.timeLimit)
          setGameState('playing')
        }
        break
      case 'quit':
        handleBackToMenu()
        break
    }
  }

  return (
    <AppLayout currentPage="game">
      {gameState === 'menu' && (
        <>
          {/* Hero Section */}
          <HeroSection
            title="Juego de Lenguaje de Señas"
            subtitle="Demuestra tu habilidad traduciendo palabras completas"
          >
            <div className="flex justify-center gap-4 flex-wrap">
              <Badge variant="secondary" className="text-sm">
                <Trophy className="h-4 w-4 mr-1" />
                {stats.levelsCompleted}/4 Niveles
              </Badge>
              <Badge variant="secondary" className="text-sm">
                <Star className="h-4 w-4 mr-1" />
                {stats.totalScore} Puntos
              </Badge>
              <Badge variant="secondary" className="text-sm">
                <Zap className="h-4 w-4 mr-1" />
                {stats.accuracy}% Precisión
              </Badge>
            </div>
          </HeroSection>

          {/* Contenido principal */}
          <div className="py-8 px-4">
            <div className="max-w-6xl mx-auto">
              {/* Estadísticas generales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatsCard
                  title="Puntuación Total"
                  value={stats.totalScore.toLocaleString()}
                  icon={Trophy}
                  color="bg-yellow-500"
                />
                <StatsCard
                  title="Juegos Jugados"
                  value={stats.gamesPlayed}
                  icon={Zap}
                  color="bg-blue-500"
                />
                <StatsCard
                  title="Precisión"
                  value={`${stats.accuracy}%`}
                  icon={CheckCircle}
                  color="bg-green-500"
                />
                <StatsCard
                  title="Mejor Racha"
                  value={stats.bestStreak}
                  icon={Star}
                  color="bg-purple-500"
                />
              </div>

              {/* Selección de niveles */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Selecciona un nivel
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {GAME_LEVELS.map((level) => (
                    <GameLevelCard
                      key={level.id}
                      id={level.id}
                      name={level.name}
                      description={level.description}
                      color={level.color}
                      bgColor={level.bgColor}
                      unlocked={level.unlocked}
                      completed={level.completed}
                      stars={level.stars}
                      onSelect={() => handleLevelSelect(level)}
                    />
                  ))}
                </div>

                {/* Información adicional */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold mb-4">¿Cómo jugar?</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Observa la palabra</p>
                        <p className="text-gray-600">Se te mostrará una palabra objetivo</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Haz las señas</p>
                        <p className="text-gray-600">Deletrea la palabra usando señas</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Gana puntos</p>
                        <p className="text-gray-600">Completa antes del tiempo límite</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {gameState === 'playing' && selectedLevel && (
        <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 text-white">
          {/* Header del juego */}
          <div className="px-4 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleGameAction('pause')}
                  >
                    Pausa
                  </Button>
                  <h1 className="text-xl font-bold">
                    Nivel {selectedLevel.id}: {selectedLevel.name}
                  </h1>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-400" />
                    <span className="font-bold">{lives}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-400" />
                    <span className="font-bold">{timeLeft}s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span className="font-bold">{score}</span>
                  </div>
                </div>
              </div>

              {/* Palabra objetivo */}
              <div className="text-center mb-8">
                <p className="text-lg mb-2">Deletrea esta palabra:</p>
                <div className="text-6xl font-bold tracking-widest bg-white/20 rounded-lg py-8 px-4">
                  {currentWord}
                </div>
              </div>

              {/* Progreso de tiempo */}
              <div className="mb-6">
                <Progress 
                  value={(timeLeft / selectedLevel.timeLimit) * 100} 
                  className="h-3 bg-white/20"
                />
              </div>

              {/* Área de cámara (placeholder) */}
              <div className="bg-black/30 rounded-lg aspect-video flex items-center justify-center mb-6">
                <p className="text-white/70">Vista de cámara aquí</p>
              </div>

              {/* Controles */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() => handleGameAction('restart')}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reiniciar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGameAction('quit')}
                  className="text-white border-white hover:bg-white/10"
                >
                  Salir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Juego Pausado</h2>
            <p className="text-gray-600 mb-6">¿Qué quieres hacer?</p>
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => handleGameAction('resume')}
              >
                Continuar
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleGameAction('restart')}
              >
                Reiniciar Nivel
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => handleGameAction('quit')}
              >
                Volver al Menú
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
