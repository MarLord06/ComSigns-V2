'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { ProtectedRoute } from '@/components/auth'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { 
  Hand, 
  Target, 
  Star, 
  ArrowRight, 
  BookOpen,
  Award
} from 'lucide-react'

export default function TutorialWelcome() {
  const { profile } = useAuth()
  const router = useRouter()

  const handleStartTutorial = () => {
    // Por ahora redirigimos a práctica, luego implementaremos el tutorial completo
    router.push('/practice')
  }

  const handleSkipTutorial = () => {
    router.push('/dashboard')
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Header de bienvenida */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-6 rounded-full">
                  <Hand className="h-16 w-16 text-blue-600" />
                </div>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                ¡Bienvenido/a, {profile?.full_name}! 🎉
              </h1>
              
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Te damos la bienvenida a <strong>ComSigns</strong>, tu plataforma para aprender 
                lenguaje de señas de manera interactiva y divertida.
              </p>
            </div>

            {/* Características del tutorial */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aprende Paso a Paso
                </h3>
                <p className="text-gray-600 text-sm">
                  Comienza con las letras básicas del alfabeto en lenguaje de señas, 
                  desde la A hasta la Z.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Práctica Interactiva
                </h3>
                <p className="text-gray-600 text-sm">
                  Usa tu cámara para practicar las señas y recibir 
                  retroalimentación en tiempo real.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Award className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Progreso Gamificado
                </h3>
                <p className="text-gray-600 text-sm">
                  Gana puntos, desbloquea logros y mantén tu racha 
                  de aprendizaje diaria.
                </p>
              </div>
            </div>

            {/* Panel de nivel de experiencia */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Star className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Tu Nivel de Experiencia
                </h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 mb-2">
                  Has seleccionado el nivel: 
                  <span className="font-semibold text-gray-900 ml-1 capitalize">
                    {profile?.experience_level === 'beginner' && 'Principiante'}
                    {profile?.experience_level === 'intermediate' && 'Intermedio'}
                    {profile?.experience_level === 'advanced' && 'Avanzado'}
                  </span>
                </p>
                
                <p className="text-sm text-gray-500">
                  {profile?.experience_level === 'beginner' && 
                    'Comenzaremos con lo básico: las letras del alfabeto y gestos fundamentales.'}
                  {profile?.experience_level === 'intermediate' && 
                    'Saltaremos algunos conceptos básicos y nos enfocaremos en vocabulario más amplio.'}
                  {profile?.experience_level === 'advanced' && 
                    'Te presentaremos desafíos más complejos y frases completas desde el inicio.'}
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleStartTutorial}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Comenzar Tutorial
              </Button>
              
              <Button
                onClick={handleSkipTutorial}
                variant="outline"
                className="px-8 py-3 text-lg font-semibold border-gray-300 hover:bg-gray-50"
              >
                Saltar por Ahora
              </Button>
            </div>

            {/* Nota informativa */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                💡 <strong>Tip:</strong> Puedes cambiar tu nivel de experiencia 
                en cualquier momento desde tu perfil.
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
