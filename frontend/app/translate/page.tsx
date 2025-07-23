"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Hand,
  Menu,
  X,
  Play,
  Target,
  Gamepad2,
  Camera,
  Square,
  RotateCcw,
  Volume2,
  Settings,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect, useCallback } from "react"

export default function TranslatorLivePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [translation, setTranslation] = useState("")
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState("")
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt">("prompt")
  const [isInitializing, setIsInitializing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Inicializar cámara
  const initializeCamera = useCallback(async () => {
    try {
      setError("")
      setIsInitializing(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setCameraPermission("denied")
      setIsConnected(false)
      setIsInitializing(false)
      setError("No se pudo acceder a la cámara. Por favor, verifica los permisos.")
    }
  }, [])

  // Capturar frame y enviar al backend
  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Dibujar frame actual en canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // Convertir a blob para enviar al backend
    canvas.toBlob(
      async (blob) => {
        if (!blob) return

        try {
          const formData = new FormData()
          formData.append("frame", blob, "frame.jpg")

          // Aquí enviarías al backend que usa cv2
          const response = await fetch("/api/translate-frame", {
            method: "POST",
            body: formData,
          })

          if (response.ok) {
            const result = await response.json()
            setTranslation(result.translation || "")
            setConfidence(result.confidence || 0)
          }
        } catch (err) {
          console.error("Error sending frame:", err)
        }
      },
      "image/jpeg",
      0.8,
    )
  }, [])

  // Iniciar traducción en tiempo real
  const startTranslation = useCallback(() => {
    if (!isConnected) return

    setIsRecording(true)
    setError("")

    // Capturar frames cada 100ms (10 FPS)
    intervalRef.current = setInterval(captureFrame, 100)
  }, [isConnected, captureFrame])

  // Detener traducción
  const stopTranslation = useCallback(() => {
    setIsRecording(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Limpiar recursos
  const cleanup = useCallback(() => {
    stopTranslation()

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsConnected(false)
  }, [stopTranslation])

  // Efectos
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <Link href="/" className="flex items-center justify-center">
          <Hand className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">ComSigns</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="ml-4"
          aria-label="Abrir menú de navegación principal"
          aria-expanded={sidebarOpen}
          aria-controls="sidebar-nav"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="ml-auto flex items-center gap-4">
          <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? "Conectado" : "Desconectado"}
          </Badge>
          <Link href="/" className="text-sm font-medium hover:text-blue-600 transition-colors">
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
            <Hand className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-gray-900">ComSigns</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú de navegación"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            href="/translate"
            className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border-l-4 border-blue-600 transition-colors group motion-reduce:transition-none"
            onClick={() => setSidebarOpen(false)}
            aria-describedby="translate-desc"
            aria-current="page"
          >
            <Play className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <div>
              <div className="font-medium text-blue-900">Traductor Live</div>
              <div id="translate-desc" className="text-sm text-blue-700">
                Traducción en tiempo real
              </div>
            </div>
          </Link>
          <Link
            href="/practice"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group motion-reduce:transition-none"
            onClick={() => setSidebarOpen(false)}
            aria-describedby="practice-desc"
          >
            <Target className="h-5 w-5 text-purple-600 group-hover:text-purple-700" aria-hidden="true" />
            <div>
              <div className="font-medium text-gray-900">Zona de Entrenamiento</div>
              <div id="practice-desc" className="text-sm text-gray-600">
                Practica y mejora tus señas
              </div>
            </div>
          </Link>
          <Link
            href="/game"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group motion-reduce:transition-none"
            onClick={() => setSidebarOpen(false)}
            aria-describedby="game-desc"
          >
            <Gamepad2 className="h-5 w-5 text-green-600 group-hover:text-green-700" aria-hidden="true" />
            <div>
              <div className="font-medium text-gray-900">SignChallenge</div>
              <div id="game-desc" className="text-sm text-gray-600">
                Aprende jugando
              </div>
            </div>
          </Link>
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 p-4 md:p-6" id="main-content" role="main">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Play className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Traductor Live</h1>
            </div>
            <p className="text-gray-600">
              Traduce lenguaje de señas a texto en tiempo real usando inteligencia artificial
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Camera Section */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Cámara en Vivo
                  </CardTitle>
                  <CardDescription>Posiciona tus manos frente a la cámara para comenzar la traducción</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative bg-gray-900 aspect-video">
                    {cameraPermission === "granted" ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                          aria-label="Vista en vivo de la cámara para captura de lenguaje de señas"
                          onLoadedMetadata={() => {
                            setCameraPermission("granted")
                            setIsConnected(true)
                            setIsInitializing(false)
                          }}
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Recording Indicator */}
                        {isRecording && (
                          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            REC
                          </div>
                        )}

                        {/* Confidence Indicator */}
                        {confidence > 0 && (
                          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                            Confianza: {Math.round(confidence * 100)}%
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-white">
                        <Camera className="h-16 w-16 mb-4 opacity-50" />
                        {isInitializing ? (
                          <>
                            <p className="text-lg mb-2">Inicializando cámara...</p>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </>
                        ) : (
                          <>
                            <p className="text-lg mb-2">Cámara no disponible</p>
                            <p className="text-sm opacity-75 text-center max-w-md">
                              {cameraPermission === "denied"
                                ? "Permisos de cámara denegados. Por favor, habilita el acceso a la cámara en tu navegador."
                                : "Haz clic en 'Inicializar Cámara' para comenzar"}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="flex items-center justify-center gap-4">
                      {cameraPermission !== "granted" ? (
                        <Button
                          onClick={initializeCamera}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={isInitializing}
                          aria-describedby="camera-init-desc"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          {isInitializing ? "Inicializando..." : "Inicializar Cámara"}
                        </Button>
                      ) : (
                        <>
                          {!isRecording ? (
                            <Button
                              onClick={startTranslation}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={!isConnected}
                              aria-describedby="start-desc"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Iniciar Traducción
                            </Button>
                          ) : (
                            <Button onClick={stopTranslation} variant="destructive" aria-describedby="stop-desc">
                              <Square className="h-4 w-4 mr-2" />
                              Detener
                            </Button>
                          )}

                          <Button variant="outline" onClick={cleanup} aria-label="Reiniciar cámara">
                            <RotateCcw className="h-4 w-4" />
                          </Button>

                          <Button variant="outline" aria-label="Configuración de cámara">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Translation Panel */}
            <div className="space-y-6">
              {/* Real-time Translation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Traducción en Tiempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[120px] p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    {translation ? (
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-900" aria-live="polite">
                          {translation}
                        </p>
                        {confidence > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${confidence * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{Math.round(confidence * 100)}%</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <p className="text-center">
                          {isRecording ? "Esperando señas..." : "Inicia la traducción para ver el texto aquí"}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Status Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado del Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cámara</span>
                    <Badge variant={cameraPermission === "granted" ? "default" : "secondary"}>
                      {cameraPermission === "granted" ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Traducción</span>
                    <Badge variant={isRecording ? "default" : "secondary"}>
                      {isRecording ? "En curso" : "Detenida"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Conexión IA</span>
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? "Conectado" : "Desconectado"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Instrucciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <p>• Posiciona tus manos claramente frente a la cámara</p>
                  <p>• Mantén buena iluminación</p>
                  <p>• Realiza las señas de forma natural</p>
                  <p>• La traducción aparecerá en tiempo real</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Hidden descriptions for screen readers */}
        <div className="sr-only">
          <div id="camera-init-desc">Solicitar permisos de cámara para comenzar la traducción</div>
          <div id="start-desc">Comenzar a capturar y traducir lenguaje de señas en tiempo real</div>
          <div id="stop-desc">Detener la captura y traducción de señas</div>
        </div>
      </main>
    </div>
  )
}
