"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Hand,
  Menu,
  X,
  Play,
  Target,
  Gamepad2,
  CheckCircle,
  Lock,
  Star,
  Trophy,
  Zap,
  BookOpen,
  Award,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useCallback } from "react"

// Datos de las letras del alfabeto
const ALPHABET_LETTERS = [
  { letter: "A", unlocked: true, completed: true, stars: 3 },
  { letter: "B", unlocked: true, completed: true, stars: 2 },
  { letter: "C", unlocked: true, completed: false, stars: 0 },
  { letter: "D", unlocked: true, completed: false, stars: 0 },
  { letter: "E", unlocked: false, completed: false, stars: 0 },
  { letter: "F", unlocked: false, completed: false, stars: 0 },
  { letter: "G", unlocked: false, completed: false, stars: 0 },
  { letter: "H", unlocked: false, completed: false, stars: 0 },
  { letter: "I", unlocked: false, completed: false, stars: 0 },
  { letter: "J", unlocked: false, completed: false, stars: 0 },
  { letter: "K", unlocked: false, completed: false, stars: 0 },
  { letter: "L", unlocked: false, completed: false, stars: 0 },
  { letter: "M", unlocked: false, completed: false, stars: 0 },
  { letter: "N", unlocked: false, completed: false, stars: 0 },
  { letter: "O", unlocked: false, completed: false, stars: 0 },
  { letter: "P", unlocked: false, completed: false, stars: 0 },
  { letter: "Q", unlocked: false, completed: false, stars: 0 },
  { letter: "R", unlocked: false, completed: false, stars: 0 },
  { letter: "S", unlocked: false, completed: false, stars: 0 },
  { letter: "T", unlocked: false, completed: false, stars: 0 },
  { letter: "U", unlocked: false, completed: false, stars: 0 },
  { letter: "V", unlocked: false, completed: false, stars: 0 },
  { letter: "W", unlocked: false, completed: false, stars: 0 },
  { letter: "X", unlocked: false, completed: false, stars: 0 },
  { letter: "Y", unlocked: false, completed: false, stars: 0 },
]

type ChallengeType = "learn" | "practice" | "speed" | "precision"

interface Challenge {
  id: string
  type: ChallengeType
  title: string
  description: string
  target: number
  icon: any
  color: string
}

const CHALLENGES: Challenge[] = [
  {
    id: "learn",
    type: "learn",
    title: "Aprender",
    description: "Observa cómo se hace la seña",
    target: 1,
    icon: BookOpen,
    color: "bg-blue-500",
  },
  {
    id: "practice",
    type: "practice",
    title: "Practicar",
    description: "Realiza la seña 5 veces",
    target: 5,
    icon: Target,
    color: "bg-purple-500",
  },
  {
    id: "speed",
    type: "speed",
    title: "Velocidad",
    description: "Haz la seña en menos de 2 segundos",
    target: 2000,
    icon: Zap,
    color: "bg-yellow-500",
  },
  {
    id: "precision",
    type: "precision",
    title: "Precisión",
    description: "Mantén 90% de confianza",
    target: 90,
    icon: Award,
    color: "bg-green-500",
  },
]

export default function PracticePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [confidence, setConfidence] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Calcular estadísticas generales
  const totalLetters = ALPHABET_LETTERS.length
  const completedLetters = ALPHABET_LETTERS.filter((l) => l.completed).length
  const totalStars = ALPHABET_LETTERS.reduce((sum, l) => sum + l.stars, 0)
  const overallProgress = (completedLetters / totalLetters) * 100

  // Iniciar desafío
  const startChallenge = useCallback((letter: string, challenge: Challenge) => {
    setSelectedLetter(letter)
    setCurrentChallenge(challenge)
    setProgress(0)
    setAttempts(0)
    setTimeElapsed(0)
    setShowSuccess(false)

    if (challenge.type === "speed") {
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        setTimeElapsed(Date.now() - startTime)
      }, 100)
    }
  }, [])

  // Completar desafío
  const completeChallenge = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setShowSuccess(true)
    setIsRecording(false)

    setTimeout(() => {
      setCurrentChallenge(null)
      setSelectedLetter(null)
      setShowSuccess(false)
    }, 2000)
  }, [])

  // Simular reconocimiento de seña
  const simulateRecognition = useCallback(() => {
    if (!currentChallenge) return

    const newConfidence = Math.random() * 0.3 + 0.7 // 70-100%
    setConfidence(newConfidence)
    setAttempts((prev) => prev + 1)

    switch (currentChallenge.type) {
      case "learn":
        setProgress(100)
        setTimeout(completeChallenge, 1000)
        break
      case "practice":
        const newProgress = Math.min(((attempts + 1) / currentChallenge.target) * 100, 100)
        setProgress(newProgress)
        if (attempts + 1 >= currentChallenge.target) {
          setTimeout(completeChallenge, 500)
        }
        break
      case "speed":
        if (timeElapsed < currentChallenge.target) {
          setProgress(100)
          setTimeout(completeChallenge, 500)
        }
        break
      case "precision":
        if (newConfidence * 100 >= currentChallenge.target) {
          setProgress(100)
          setTimeout(completeChallenge, 500)
        }
        break
    }
  }, [currentChallenge, attempts, timeElapsed, completeChallenge])

  if (currentChallenge && selectedLetter) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Challenge Header */}
        <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 backdrop-blur sticky top-0 z-50">
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentChallenge(null)
              setSelectedLetter(null)
            }}
            className="mr-4"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${currentChallenge.color} flex items-center justify-center`}>
              <currentChallenge.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">
                Letra {selectedLetter} - {currentChallenge.title}
              </h1>
              <p className="text-sm text-gray-600">{currentChallenge.description}</p>
            </div>
          </div>
          <div className="ml-auto">
            <Badge variant="outline" className="font-mono">
              {Math.round(progress)}%
            </Badge>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-6">
              <Progress value={progress} className="h-3" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Reference/Camera */}
              <Card>
                <CardHeader>
                  <CardTitle>{currentChallenge.type === "learn" ? "Referencia" : "Tu Práctica"}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative bg-gray-900 aspect-video">
                    {currentChallenge.type === "learn" ? (
                      <div className="flex items-center justify-center h-full">
                        <Image
                          src={`/placeholder.svg?height=300&width=400&text=Seña+${selectedLetter}`}
                          width={400}
                          height={300}
                          alt={`Seña de la letra ${selectedLetter}`}
                          className="rounded-lg"
                        />
                      </div>
                    ) : (
                      <>
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        {confidence > 0 && (
                          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                            {Math.round(confidence * 100)}%
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 border-t">
                    <div className="flex justify-center">
                      {currentChallenge.type === "learn" ? (
                        <Button onClick={simulateRecognition} className="bg-blue-600 hover:bg-blue-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Entendido
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setIsRecording(!isRecording)
                            if (!isRecording) {
                              setTimeout(simulateRecognition, 1000)
                            }
                          }}
                          className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                          {isRecording ? (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Detener
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Practicar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats & Instructions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Estadísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Intentos</span>
                      <Badge variant="outline">{attempts}</Badge>
                    </div>
                    {currentChallenge.type === "speed" && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tiempo</span>
                        <Badge variant="outline">{(timeElapsed / 1000).toFixed(1)}s</Badge>
                      </div>
                    )}
                    {confidence > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Confianza</span>
                        <Badge variant="outline">{Math.round(confidence * 100)}%</Badge>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Progreso</span>
                      <Badge variant="outline">{Math.round(progress)}%</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Instrucciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      {currentChallenge.type === "learn" && (
                        <>
                          <p>• Observa cuidadosamente la seña de referencia</p>
                          <p>• Nota la posición de los dedos y la mano</p>
                          <p>• Haz clic en "Entendido" cuando estés listo</p>
                        </>
                      )}
                      {currentChallenge.type === "practice" && (
                        <>
                          <p>• Realiza la seña {currentChallenge.target} veces</p>
                          <p>• Mantén la seña por 2-3 segundos</p>
                          <p>• Asegúrate de que sea reconocida correctamente</p>
                        </>
                      )}
                      {currentChallenge.type === "speed" && (
                        <>
                          <p>• Haz la seña lo más rápido posible</p>
                          <p>• Objetivo: menos de {currentChallenge.target / 1000} segundos</p>
                          <p>• Mantén la precisión mientras vas rápido</p>
                        </>
                      )}
                      {currentChallenge.type === "precision" && (
                        <>
                          <p>• Enfócate en la forma perfecta de la seña</p>
                          <p>• Objetivo: {currentChallenge.target}% de confianza</p>
                          <p>• Tómate tu tiempo para hacerlo bien</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Success Modal */}
            {showSuccess && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-96 mx-4">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">¡Desafío Completado!</h3>
                    <p className="text-gray-600 mb-4">
                      Has completado el desafío "{currentChallenge.title}" para la letra {selectedLetter}
                    </p>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3].map((star) => (
                        <Star key={star} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center">
          <Hand className="h-8 w-8 text-purple-600" />
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
        <div className="ml-auto flex items-center gap-4">
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            {totalStars} estrellas
          </Badge>
          <Link href="/" className="text-sm font-medium hover:text-purple-600 transition-colors">
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
            <Hand className="h-6 w-6 text-purple-600" />
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
            className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border-l-4 border-purple-600"
            onClick={() => setSidebarOpen(false)}
            aria-current="page"
          >
            <Target className="h-5 w-5 text-purple-600" />
            <div>
              <div className="font-medium text-purple-900">Zona de Entrenamiento</div>
              <div className="text-sm text-purple-700">Practica y mejora tus señas</div>
            </div>
          </Link>
          <Link
            href="/game"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group"
            onClick={() => setSidebarOpen(false)}
          >
            <Gamepad2 className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">SignChallenge</div>
              <div className="text-sm text-gray-600">Aprende jugando</div>
            </div>
          </Link>
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 p-4 md:p-6" id="main-content" role="main">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-8 w-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Zona de Entrenamiento</h1>
            </div>
            <p className="text-gray-600 mb-6">
              Aprende el alfabeto en lenguaje de señas paso a paso. Completa desafíos para desbloquear nuevas letras.
            </p>

            {/* Overall Progress */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Progreso General</h3>
                    <p className="text-sm text-gray-600">
                      {completedLetters} de {totalLetters} letras completadas
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{Math.round(overallProgress)}%</div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {totalStars} estrellas
                    </div>
                  </div>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </CardContent>
            </Card>
          </div>

          {/* Alphabet Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4 mb-8">
            {ALPHABET_LETTERS.map((letterData, index) => (
              <Card
                key={letterData.letter}
                className={`relative cursor-pointer transition-all hover:scale-105 ${
                  letterData.unlocked
                    ? letterData.completed
                      ? "bg-green-50 border-green-200 hover:bg-green-100"
                      : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                    : "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                }`}
                onClick={() => letterData.unlocked && setSelectedLetter(letterData.letter)}
              >
                <CardContent className="p-4 text-center">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2 ${
                        letterData.completed
                          ? "bg-green-500 text-white"
                          : letterData.unlocked
                            ? "bg-blue-500 text-white"
                            : "bg-gray-300 text-gray-500"
                      }`}
                    >
                      {letterData.unlocked ? letterData.letter : <Lock className="h-5 w-5" />}
                    </div>
                    {letterData.completed && (
                      <CheckCircle className="absolute -top-1 -right-1 h-6 w-6 text-green-500 bg-white rounded-full" />
                    )}
                  </div>
                  {letterData.unlocked && (
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= letterData.stars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Letter Details */}
          {selectedLetter && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {selectedLetter}
                  </div>
                  <div>
                    <h2 className="text-2xl">Letra {selectedLetter}</h2>
                    <p className="text-gray-600">Completa todos los desafíos para dominar esta letra</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {CHALLENGES.map((challenge) => (
                    <Card
                      key={challenge.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => startChallenge(selectedLetter, challenge)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full ${challenge.color} flex items-center justify-center`}>
                            <challenge.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                            <p className="text-sm text-gray-600">{challenge.description}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full bg-transparent">
                          <Play className="h-4 w-4 mr-2" />
                          Comenzar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{completedLetters}</div>
                <div className="text-sm text-gray-600">Letras Completadas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{totalStars}</div>
                <div className="text-sm text-gray-600">Estrellas Ganadas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{Math.round(overallProgress)}%</div>
                <div className="text-sm text-gray-600">Progreso Total</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
