/**
 * Página de práctica refactorizada usando componentes modulares
 */

"use client"

import { useState } from "react"
import { AppLayout, HeroSection } from '@/components/layout'
import { LetterCard, ChallengeCard, StatsCard } from '@/components/shared'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  Zap,
  BookOpen,
  Award,
  TrendingUp,
  Target
} from "lucide-react"

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
  icon: React.ElementType
  color: string
  progress: number
  completed: boolean
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
    progress: 1,
    completed: true
  },
  {
    id: "practice",
    type: "practice",
    title: "Practicar",
    description: "Realiza la seña 5 veces",
    target: 5,
    icon: Target,
    color: "bg-purple-500",
    progress: 3,
    completed: false
  },
  {
    id: "speed",
    type: "speed",
    title: "Velocidad",
    description: "Haz la seña en menos de 2 segundos",
    target: 1,
    icon: Zap,
    color: "bg-yellow-500",
    progress: 0,
    completed: false
  },
  {
    id: "precision",
    type: "precision",
    title: "Precisión",
    description: "Mantén 90% de confianza",
    target: 1,
    icon: Award,
    color: "bg-red-500",
    progress: 0,
    completed: false
  },
]

export default function PracticePage() {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [currentChallenge, setCurrentChallenge] = useState<string | null>(null)

  const handleLetterSelect = (letter: string) => {
    setSelectedLetter(letter)
    setCurrentChallenge(null)
  }

  const handleChallengeStart = (challengeId: string) => {
    setCurrentChallenge(challengeId)
  }

  const stats = {
    totalLetters: ALPHABET_LETTERS.filter(l => l.completed).length,
    totalStars: ALPHABET_LETTERS.reduce((sum, l) => sum + l.stars, 0),
    completionRate: Number(((ALPHABET_LETTERS.filter(l => l.completed).length / ALPHABET_LETTERS.length) * 100).toFixed(2)),
    streak: 5
  }

  return (
    <AppLayout currentPage="practice">
      {/* Hero Section */}
      <HeroSection
        title="Práctica de Lenguaje de Señas"
        subtitle="Aprende y perfecciona cada letra del alfabeto"
      >
        <div className="flex justify-center gap-4 flex-wrap">
          <Badge variant="secondary" className="text-sm">
            <Trophy className="h-4 w-4 mr-1" />
            {stats.totalLetters}/25 Letras
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Award className="h-4 w-4 mr-1" />
            {stats.totalStars} Estrellas
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            {stats.completionRate}% Completado
          </Badge>
        </div>
      </HeroSection>

      {/* Contenido principal */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Estadísticas generales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Letras Completadas"
              value={`${stats.totalLetters}/25`}
              icon={Trophy}
              color="bg-green-500"
            />
            <StatsCard
              title="Estrellas"
              value={stats.totalStars}
              icon={Award}
              color="bg-yellow-500"
            />
            <StatsCard
              title="Progreso"
              value={`${stats.completionRate}%`}
              icon={TrendingUp}
              color="bg-blue-500"
            />
            <StatsCard
              title="Racha"
              value={`${stats.streak} días`}
              icon={Zap}
              color="bg-purple-500"
            />
          </div>

          {!selectedLetter ? (
            /* Vista de selección de letras */
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Selecciona una letra para practicar
              </h2>
              
              <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4">
                {ALPHABET_LETTERS.map((letter) => (
                  <LetterCard
                    key={letter.letter}
                    letter={letter.letter}
                    unlocked={letter.unlocked}
                    completed={letter.completed}
                    stars={letter.stars}
                    onSelect={() => handleLetterSelect(letter.letter)}
                  />
                ))}
              </div>

              {/* Progreso general */}
              <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Progreso General</h3>
                <Progress value={stats.completionRate} className="mb-2" />
                <p className="text-sm text-gray-600">
                  Has completado {stats.totalLetters} de 25 letras ({stats.completionRate}%)
                </p>
              </div>
            </div>
          ) : (
            /* Vista de práctica de letra específica */
            <div>
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedLetter(null)}
                >
                  ← Volver
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">
                  Practicando letra &quot;{selectedLetter}&quot;
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {CHALLENGES.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    title={challenge.title}
                    description={challenge.description}
                    target={challenge.target}
                    icon={challenge.icon}
                    color={challenge.color}
                    progress={challenge.progress}
                    completed={challenge.completed}
                    onStart={() => handleChallengeStart(challenge.id)}
                  />
                ))}
              </div>

              {currentChallenge && (
                <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Desafío en progreso
                  </h3>
                  <p className="text-blue-700">
                    Ejecutando: {CHALLENGES.find(c => c.id === currentChallenge)?.title}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setCurrentChallenge(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
