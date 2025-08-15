'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { ProtectedRoute } from '@/components/auth'
import { useAuth } from '@/lib/auth-context'
import { 
  BarChart3, 
  Target, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Star,
  Medal,
  Zap,
  Calendar,
  Award
} from 'lucide-react'

export default function Dashboard() {
  const { user, profile, stats, loading, isNewUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (!loading && user && isNewUser) {
      router.push('/tutorial/welcome')
      return
    }
  }, [user, loading, isNewUser, router])

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (!user || !profile) {
    return null
  }

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color = 'blue' 
  }: {
    icon: React.ElementType
    title: string
    value: string | number
    subtitle?: string
    color?: 'blue' | 'green' | 'purple' | 'orange'
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200'
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    )
  }

  const ProgressBar = ({ 
    label, 
    current, 
    total, 
    color = 'blue' 
  }: {
    label: string
    current: number
    total: number
    color?: string
  }) => {
    const percentage = Math.min((current / total) * 100, 100)
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-gray-500">{current}/{total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  // Datos por defecto si no hay estadísticas
  const userStats = stats || {
    total_sessions: 0,
    total_practice_time: 0,
    letters_completed: [],
    average_accuracy: 0,
    current_streak: 0,
    best_streak: 0,
    total_points: 0,
    level: 1
  }

  const timeFormatted = Math.floor(userStats.total_practice_time / 60)
  const lettersTotal = 24 // A-Y (excluyendo J y Z)
  const lettersCompleted = userStats.letters_completed.length

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="min-h-screen bg-gray-50">
        {/* Header del Dashboard */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  ¡Hola, {profile.full_name}! 👋
                </h1>
                <p className="text-gray-600 mt-1">
                  Aquí está tu progreso en el aprendizaje de lenguaje de señas
                </p>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                <Medal className="text-blue-600" size={20} />
                <span className="font-semibold text-blue-900">Nivel {userStats.level}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Grid de Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Target}
              title="Sesiones Completadas"
              value={userStats.total_sessions}
              subtitle="sesiones de práctica"
              color="blue"
            />
            <StatCard
              icon={Clock}
              title="Tiempo Total"
              value={`${timeFormatted}min`}
              subtitle="tiempo practicando"
              color="green"
            />
            <StatCard
              icon={TrendingUp}
              title="Precisión Promedio"
              value={`${userStats.average_accuracy.toFixed(2)}%`}
              subtitle="en reconocimiento"
              color="purple"
            />
            <StatCard
              icon={Zap}
              title="Racha Actual"
              value={userStats.current_streak}
              subtitle={`Mejor: ${userStats.best_streak} días`}
              color="orange"
            />
          </div>

          {/* Grid de Progreso y Actividad */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Progreso del Alfabeto */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Progreso del Alfabeto</h2>
              </div>
              
              <div className="space-y-6">
                <ProgressBar
                  label="Letras Aprendidas"
                  current={lettersCompleted}
                  total={lettersTotal}
                  color="blue"
                />
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Letras Completadas</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from('ABCDEFGHIKLMNOPQRSTUVWXY').map(letter => (
                      <span
                        key={letter}
                        className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold ${
                          userStats.letters_completed.includes(letter)
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de Logros */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="text-yellow-600" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Logros</h2>
              </div>
              
              <div className="space-y-4">
                {/* Logro de Primera Sesión */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  userStats.total_sessions > 0 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <Star className={`${
                    userStats.total_sessions > 0 ? 'text-green-600' : 'text-gray-400'
                  }`} size={20} />
                  <div>
                    <p className="font-medium text-gray-900">Primera Sesión</p>
                    <p className="text-xs text-gray-500">Completa tu primera práctica</p>
                  </div>
                </div>

                {/* Logro de Primera Letra */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  lettersCompleted > 0 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <Award className={`${
                    lettersCompleted > 0 ? 'text-green-600' : 'text-gray-400'
                  }`} size={20} />
                  <div>
                    <p className="font-medium text-gray-900">Primera Letra</p>
                    <p className="text-xs text-gray-500">Aprende tu primera letra</p>
                  </div>
                </div>

                {/* Logro de Racha */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  userStats.current_streak >= 3 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  <Calendar className={`${
                    userStats.current_streak >= 3 ? 'text-green-600' : 'text-gray-400'
                  }`} size={20} />
                  <div>
                    <p className="font-medium text-gray-900">Constancia</p>
                    <p className="text-xs text-gray-500">Mantén una racha de 3 días</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          {lettersCompleted === 0 && (
            <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">¡Comienza tu viaje!</h3>
                  <p className="text-blue-100">
                    Empieza con el tutorial para aprender las primeras letras del alfabeto
                  </p>
                </div>
                <button
                  onClick={() => router.push('/tutorial/welcome')}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Empezar Tutorial
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
    </ProtectedRoute>
  )
}
