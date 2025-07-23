"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Hand,
  Menu,
  X,
  Play,
  Target,
  Gamepad2,
  Lock,
  Star,
  Trophy,
  Zap,
  Heart,
  Clock,
  RotateCcw,
  Home,
  CheckCircle,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect, useCallback } from "react"

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

// Banco de palabras por nivel
const WORDS_BY_LEVEL: { [key: number]: string[] } = {
  1: ["SOL", "MAR", "PAN", "LUZ", "PAZ", "SÍ", "NO", "YO", "TÚ", "ÉL"],
  2: ["CASA", "AGUA", "AMOR", "VIDA", "MESA", "LIBRO", "FLOR", "CIELO", "TIERRA", "FUEGO"],
  3: ["FAMILIA", "ESCUELA", "TRABAJO", "AMISTAD", "LIBERTAD", "JUSTICIA", "BELLEZA", "VERDAD"],
  4: ["COMUNICACIÓN", "INTELIGENCIA", "CREATIVIDAD", "RESPONSABILIDAD", "SOLIDARIDAD", "PERSEVERANCIA"],
}

type GameState = "menu" | "playing" | "paused" | "gameOver" | "levelComplete"

export default function GamePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null)
  const [gameState, setGameState] = useState<GameState>("menu")
  const [currentWord, setCurrentWord] = useState("")
  const [userInput, setUserInput] = useState("")
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(5)
  const [timeLeft, setTimeLeft] = useState(15)
  const [wordsCompleted, setWordsCompleted] = useState(0)
  const [streak, setStreak] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [confidence, setConfidence] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Generar palabra aleatoria según el nivel
  const generateRandomWord = useCallback((level: GameLevel) => {
    const words = WORDS_BY_LEVEL[level.id] || WORDS_BY_LEVEL[1]
    const randomIndex = Math.floor(Math.random() * words.length)
    return words[randomIndex]
  }, [])

  // Iniciar juego
  const startGame = useCallback(
    (level: GameLevel) => {
      setSelectedLevel(level)
      setGameState("playing")
      setScore(0)
      setLives(level.lives)
      setWordsCompleted(0)
      setStreak(0)
      setUserInput("")

      const firstWord = generateRandomWord(level)
      setCurrentWord(firstWord)
      setTimeLeft(level.timeLimit)

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Tiempo agotado
            setLives((prevLives) => {
              const newLives = prevLives - 1
              if (newLives <= 0) {
                setGameState("gameOver")
              } else {
                // Nueva palabra
                const newWord = generateRandomWord(level)
                setCurrentWord(newWord)
                setUserInput("")
                setStreak(0)
                return newLives
              }
              return newLives
            })
            return level.timeLimit
          }
          return prev - 1
        })
      }, 1000)
    },
    [generateRandomWord],
  )

  // Verificar palabra
  const checkWord = useCallback(() => {
    if (!selectedLevel) return

    const isCorrect = userInput.toUpperCase() === currentWord.toUpperCase()

    if (isCorrect) {
      // Palabra correcta
      const points = selectedLevel.pointsMultiplier * 100 + streak * 10 + timeLeft * 5
      setScore((prev) => prev + points)
      setWordsCompleted((prev) => prev + 1)
      setStreak((prev) => prev + 1)

      // Nueva palabra
      const newWord = generateRandomWord(selectedLevel)
      setCurrentWord(newWord)
      setUserInput("")
      setTimeLeft(selectedLevel.timeLimit)

      // Verificar si completó el nivel (ejemplo: 10 palabras)
      if (wordsCompleted + 1 >= 10) {
        setGameState("levelComplete")
        if (timerRef.current) clearInterval(timerRef.current)
      }
    } else {
      // Palabra incorrecta
      setLives((prev) => {
        const newLives = prev - 1
        if (newLives <= 0) {
          setGameState("gameOver")
          if (timerRef.current) clearInterval(timerRef.current)
        }
        return newLives
      })
      setStreak(0)
      setUserInput("")
    }
  }, [userInput, currentWord, selectedLevel, streak, timeLeft, wordsCompleted, generateRandomWord])

  // Simular reconocimiento de seña
  const simulateRecognition = useCallback(() => {
    // Simular reconocimiento de letras individuales
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const randomLetter = letters[Math.floor(Math.random() * letters.length)]
    const newConfidence = Math.random() * 0.4 + 0.6

    setConfidence(newConfidence)

    if (newConfidence > 0.8) {
      setUserInput((prev) => prev + randomLetter)
    }
  }, [])

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Reiniciar juego
  const resetGame = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setGameState("menu")
    setSelectedLevel(null)
  }

  // Pantalla de juego
  if (gameState === "playing" && selectedLevel) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        {/* Game Header */}
        <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 backdrop-blur sticky top-0 z-50">
          <Button variant="ghost" onClick={resetGame} className="mr-4">
            <Home className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Badge className={`${selectedLevel.bgColor} text-white`}>{selectedLevel.name}</Badge>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <span className="font-bold">{score.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="font-bold">x{streak}</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: selectedLevel.lives }).map((_, i) => (
                <Heart key={i} className={`h-5 w-5 ${i < lives ? "fill-red-500 text-red-500" : "text-gray-300"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className={`font-bold ${timeLeft <= 5 ? "text-red-600" : "text-blue-600"}`}>{timeLeft}s</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Palabra {wordsCompleted + 1} de 10</span>
                <span className="text-sm text-gray-600">{Math.round((wordsCompleted / 10) * 100)}%</span>
              </div>
              <Progress value={(wordsCompleted / 10) * 100} className="h-2" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Word Challenge */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-center text-3xl font-bold text-gray-900">{currentWord}</CardTitle>
                  <CardDescription className="text-center">
                    Deletrea esta palabra usando lenguaje de señas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* User Input Display */}
                    <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 min-h-[60px]">
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-gray-900 mb-2">{userInput || "..."}</div>
                        <div className="text-sm text-gray-600">
                          {userInput.length} / {currentWord.length} letras
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={checkWord}
                        disabled={userInput.length !== currentWord.length}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verificar
                      </Button>
                      <Button variant="outline" onClick={() => setUserInput("")}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Limpiar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Camera */}
              <Card>
                <CardHeader>
                  <CardTitle>Cámara de Señas</CardTitle>
                  <CardDescription>Realiza las señas letra por letra</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative bg-gray-900 aspect-video">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                    {/* Recording Indicator */}
                    {isRecording && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        REC
                      </div>
                    )}

                    {/* Confidence */}
                    {confidence > 0 && (
                      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {Math.round(confidence * 100)}%
                      </div>
                    )}

                    {/* Next Letter Hint */}
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      Siguiente: {currentWord[userInput.length] || "✓"}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border-t">
                    <div className="flex justify-center">
                      <Button
                        onClick={() => {
                          setIsRecording(!isRecording)
                          if (!isRecording) {
                            setTimeout(simulateRecognition, 1000)
                          }
                        }}
                        className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                      >
                        {isRecording ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Detener
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Capturar Seña
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Pantalla de Game Over
  if (gameState === "gameOver") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Juego Terminado!</h2>
              <p className="text-gray-600 mb-4">Has completado {wordsCompleted} palabras</p>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span>Puntuación Final:</span>
                  <span className="font-bold">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mejor Racha:</span>
                  <span className="font-bold">x{streak}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={resetGame} variant="outline" className="flex-1 bg-transparent">
                  <Home className="h-4 w-4 mr-2" />
                  Menú
                </Button>
                <Button
                  onClick={() => selectedLevel && startGame(selectedLevel)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Pantalla de Nivel Completado
  if (gameState === "levelComplete") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Nivel Completado!</h2>
              <p className="text-gray-600 mb-4">Has completado el nivel {selectedLevel?.name}</p>
              <div className="flex justify-center gap-1 mb-6">
                {[1, 2, 3].map((star) => (
                  <Star key={star} className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span>Puntuación Final:</span>
                  <span className="font-bold">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Palabras Completadas:</span>
                  <span className="font-bold">{wordsCompleted}</span>
                </div>
              </div>
              <Button onClick={resetGame} className="w-full bg-green-600 hover:bg-green-700">
                <Home className="h-4 w-4 mr-2" />
                Volver al Menú
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Menú principal de selección de niveles
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-green-600 focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center">
          <Hand className="h-8 w-8 text-green-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">ComSigns</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="ml-4"
          aria-label="Abrir menú de navegación principal"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="ml-auto">
          <Link href="/" className="text-sm font-medium hover:text-green-600 transition-colors">
            Inicio
          </Link>
        </div>
      </header>

      {/* Sidebar */}
      <div
        id="sidebar-nav"
        role="navigation"
        aria-label="Menú principal de funcionalidades"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out motion-reduce:transition-none`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Hand className="h-6 w-6 text-green-600" />
            <span className="font-bold text-gray-900">ComSigns</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            href="/translate"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
            onClick={() => setSidebarOpen(false)}
          >
            <Play className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Traductor Live</div>
              <div className="text-sm text-gray-600">Traducción en tiempo real</div>
            </div>
          </Link>
          <Link
            href="/practice"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
            onClick={() => setSidebarOpen(false)}
          >
            <Target className="h-5 w-5 text-purple-600" />
            <div>
              <div className="font-medium text-gray-900">Zona de Entrenamiento</div>
              <div className="text-sm text-gray-600">Practica y mejora tus señas</div>
            </div>
          </Link>
          <Link
            href="/game"
            className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border-l-4 border-green-600"
            onClick={() => setSidebarOpen(false)}
            aria-current="page"
          >
            <Gamepad2 className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-green-900">SignChallenge</div>
              <div className="text-sm text-green-700">Aprende jugando</div>
            </div>
          </Link>
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 p-4 md:p-6" id="main-content" role="main">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Gamepad2 className="h-12 w-12 text-green-600" />
              <h1 className="text-4xl font-bold text-gray-900">SignChallenge</h1>
            </div>
            <p className="text-xl text-gray-600 mb-6">¡Pon a prueba tus habilidades en lenguaje de señas!</p>
            <div className="flex justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span>Gana puntos</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span>Construye rachas</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <span>Desbloquea niveles</span>
              </div>
            </div>
          </div>

          {/* Level Selection */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {GAME_LEVELS.map((level) => (
              <Card
                key={level.id}
                className={`relative cursor-pointer transition-all hover:scale-105 ${
                  level.unlocked
                    ? level.completed
                      ? "bg-green-50 border-green-200 hover:bg-green-100"
                      : "bg-white border-gray-200 hover:shadow-lg"
                    : "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                }`}
                onClick={() => level.unlocked && startGame(level)}
              >
                <CardHeader className="text-center">
                  <div className="relative mx-auto mb-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                        level.unlocked ? level.bgColor : "bg-gray-400"
                      }`}
                    >
                      {level.unlocked ? level.id : <Lock className="h-8 w-8" />}
                    </div>
                    {level.completed && (
                      <CheckCircle className="absolute -top-1 -right-1 h-6 w-6 text-green-500 bg-white rounded-full" />
                    )}
                  </div>
                  <CardTitle className={level.unlocked ? level.color : "text-gray-500"}>{level.name}</CardTitle>
                  <CardDescription>{level.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tiempo:</span>
                      <span className="font-medium">{level.timeLimit}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vidas:</span>
                      <div className="flex gap-1">
                        {Array.from({ length: level.lives }).map((_, i) => (
                          <Heart key={i} className="h-3 w-3 fill-red-500 text-red-500" />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Multiplicador:</span>
                      <span className="font-medium">x{level.pointsMultiplier}</span>
                    </div>
                    {level.unlocked && (
                      <div className="flex justify-center gap-1 pt-2">
                        {[1, 2, 3].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= level.stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {level.unlocked && (
                    <Button className="w-full mt-4" variant={level.completed ? "outline" : "default"}>
                      <Play className="h-4 w-4 mr-2" />
                      {level.completed ? "Jugar de Nuevo" : "Comenzar"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Game Instructions */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>¿Cómo Jugar?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Selecciona un Nivel</h3>
                  <p className="text-sm text-gray-600">
                    Elige tu nivel de dificultad. Los niveles se desbloquean progresivamente.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-purple-600">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Deletrea Palabras</h3>
                  <p className="text-sm text-gray-600">
                    Usa lenguaje de señas para deletrear las palabras que aparecen en pantalla.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-green-600">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Gana Puntos</h3>
                  <p className="text-sm text-gray-600">
                    Completa palabras rápidamente para ganar más puntos y construir rachas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
