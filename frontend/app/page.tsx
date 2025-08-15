"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthButton } from "@/components/auth"
import { useAuth } from "@/lib/auth-context"
import {
  ArrowRight,
  Brain,
  Hand,
  MessageSquare,
  Users,
  Zap,
  Shield,
  Globe,
  Menu,
  X,
  Play,
  Gamepad2,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

export default function LandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, profile } = useAuth()

  return (
    <div className="flex flex-col min-h-screen">
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
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="#about" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Nosotros
          </Link>
          <Link href="#features" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Características
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Cómo Funciona
          </Link>
          <Link href="#contact" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Contacto
          </Link>
          
          {/* Botón de autenticación / Dashboard */}
          <div className="ml-4">
            <AuthButton />
          </div>
        </nav>
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
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group motion-reduce:transition-none"
            onClick={() => setSidebarOpen(false)}
            aria-describedby="translate-desc"
          >
            <Play className="h-5 w-5 text-blue-600 group-hover:text-blue-700" aria-hidden="true" />
            <div>
              <div className="font-medium text-gray-900">Traductor Live</div>
              <div id="translate-desc" className="text-sm text-gray-600">
                Traducción en tiempo real
              </div>
            </div>
          </Link>
          {/*
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
          */}
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

      <main className="flex-1" id="main-content" role="main">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Badge className="w-fit bg-blue-100 text-blue-800 hover:bg-blue-200">
                    🚀 Tecnología de IA Avanzada
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Rompiendo Barreras de Comunicación
                  </h1>
                  <p className="max-w-[600px] text-gray-600 md:text-xl">
                    Nuestra inteligencia artificial traduce lenguaje de señas a texto en tiempo real, conectando
                    comunidades y facilitando la comunicación inclusiva.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  {user ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-700" aria-describedby="cta-description">
                        Ir al Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/auth/register">
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-700" aria-describedby="cta-description">
                        Probar Ahora
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                  )}
                  <Link href="/translate">
                    <Button variant="outline" size="lg" aria-label="Ver demostración del sistema ComSigns">
                      Ver Demo
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>+1000 usuarios</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    <span>Traducción instantánea</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                  <Image
                    src="/images/landing/heroImage.png"
                    width="400"
                    height="400"
                    alt="Demostración de persona usando lenguaje de señas siendo traducido por inteligencia artificial en tiempo real"
                    className="relative rounded-2xl shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <div id="cta-description" className="sr-only">
          Acceder al sistema de traducción de lenguaje de señas ComSigns
        </div>

        {/* Sección especial para usuarios autenticados */}
        {user && profile && (
          <section className="w-full py-12 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="container px-4 md:px-6">
              <div className="text-center text-white mb-8">
                <h2 className="text-3xl font-bold mb-4">
                  ¡Hola de nuevo, {profile.full_name}! 👋
                </h2>
                <p className="text-xl text-blue-100">
                  Continúa tu aprendizaje desde donde lo dejaste
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                    <CardTitle>Dashboard</CardTitle>
                    <CardDescription>
                      Ve tu progreso y estadísticas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/dashboard">
                      <Button className="w-full">
                        Ver Dashboard
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/*
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Target className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <CardTitle>Práctica</CardTitle>
                    <CardDescription>
                      Mejora tus habilidades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/practice">
                      <Button variant="outline" className="w-full">
                        Practicar
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                */}

                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Play className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                    <CardTitle>Traductor</CardTitle>
                    <CardDescription>
                      Traduce en tiempo real
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/translate">
                      <Button variant="outline" className="w-full">
                        Traducir
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        <section id="about" className="w-full py-12 md:py-24 lg:py-32" aria-labelledby="about-heading">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <Badge className="w-fit">Sobre Nosotros</Badge>
                <h2 id="about-heading" className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Innovación al Servicio de la Inclusión
                </h2>
                <p className="text-gray-600 md:text-lg">
                  Somos un equipo apasionado de desarrolladores, investigadores en IA y defensores de la accesibilidad.
                  Nuestra misión es crear tecnología que elimine las barreras de comunicación y promueva un mundo más
                  inclusivo.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Brain className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold">IA Avanzada</h3>
                      <p className="text-sm text-gray-600">
                        Algoritmos de deep learning entrenados con miles de horas de lenguaje de señas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold">Privacidad Garantizada</h3>
                      <p className="text-sm text-gray-600">
                        Procesamiento seguro que respeta la privacidad de los usuarios
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <Image
                  src="/images/landing/about_section.png"
                  width="500"
                  height="300"
                  alt="Equipo trabajando en tecnología de accesibilidad"
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50" aria-labelledby="features-heading">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <Badge className="w-fit">Características</Badge>
              <h2 id="features-heading" className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Tecnología que Marca la Diferencia
              </h2>
              <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Nuestro sistema utiliza inteligencia artificial de vanguardia para ofrecer traducciones precisas y en
                tiempo real
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <Hand className="h-12 w-12 text-blue-600" />
                  <CardTitle>Reconocimiento de Señas</CardTitle>
                  <CardDescription>Detecta y analiza gestos de lenguaje de señas con precisión del 95%</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Reconocimiento en tiempo real</li>
                    <li>• Compatible con múltiples dialectos</li>
                    <li>• Funciona en diferentes condiciones de luz</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <MessageSquare className="h-12 w-12 text-purple-600" />
                  <CardTitle>Traducción Instantánea</CardTitle>
                  <CardDescription>Convierte señas a texto natural de forma fluida y contextual</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Procesamiento en milisegundos</li>
                    <li>• Comprensión contextual</li>
                    <li>• Soporte para frases complejas</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <CardHeader>
                  <Globe className="h-12 w-12 text-green-600" />
                  <CardTitle>Próximamente: Bidireccional</CardTitle>
                  <CardDescription>Traducción de texto a lenguaje de señas con avatares 3D</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Avatares realistas</li>
                    <li>• Expresiones faciales naturales</li>
                    <li>• Personalización de velocidad</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32" aria-labelledby="how-it-works-heading">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <Badge className="w-fit">Cómo Funciona</Badge>
              <h2 id="how-it-works-heading" className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Simple, Rápido y Efectivo
              </h2>
              <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                En solo tres pasos, conecta mundos a través de la tecnología
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-xl font-bold">Captura</h3>
                <p className="text-gray-600">
                  Nuestra cámara inteligente detecta y captura los movimientos de las manos en tiempo real
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                  <span className="text-2xl font-bold text-purple-600">2</span>
                </div>
                <h3 className="text-xl font-bold">Procesa</h3>
                <p className="text-gray-600">
                  La IA analiza los gestos y los interpreta usando modelos de deep learning avanzados
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="text-xl font-bold">Traduce</h3>
                <p className="text-gray-600">Convierte instantáneamente las señas en texto claro y comprensible</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center text-white">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">¿Listo para Romper las Barreras?</h2>
              <p className="max-w-[600px] text-blue-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Únete a nuestra comunidad y experimenta el futuro de la comunicación inclusiva
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-blue-700 hover:text-white transition-colors motion-reduce:transition-none"
                  aria-describedby="final-cta-desc"
                >
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
                <div id="final-cta-desc" className="sr-only">
                  Comenzar a usar ComSigns de forma gratuita sin necesidad de registro
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        id="contact"
        className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-gray-50"
        role="contentinfo"
        aria-label="Información de contacto y enlaces legales"
      >
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Hand className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-gray-900">ComSigns</span>
          </div>
          <p className="text-xs text-gray-600">© 2024 ComSigns. Construyendo puentes de comunicación con tecnología.</p>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-xs hover:underline underline-offset-4 text-gray-600">
              Términos de Servicio
            </Link>
            <Link href="#" className="text-xs hover:underline underline-offset-4 text-gray-600">
              Privacidad
            </Link>
            <Link href="#" className="text-xs hover:underline underline-offset-4 text-gray-600">
              Contacto
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
