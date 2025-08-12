/**
 * Componentes reutilizables para progreso y estados
 * Evita duplicar código de cards de letras, niveles, etc.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Lock, 
  Star, 
  Trophy,
  Play
} from 'lucide-react';

// Componente para letras del alfabeto
interface LetterCardProps {
  letter: string;
  unlocked: boolean;
  completed: boolean;
  stars: number;
  onSelect?: () => void;
}

export function LetterCard({ letter, unlocked, completed, stars, onSelect }: LetterCardProps) {
  return (
    <Card 
      className={`relative transition-all hover:shadow-md cursor-pointer ${
        !unlocked ? 'opacity-50' : ''
      } ${completed ? 'ring-2 ring-green-500' : ''}`}
      onClick={unlocked ? onSelect : undefined}
    >
      <CardContent className="p-6 text-center">
        {!unlocked && (
          <Lock className="absolute top-2 right-2 h-4 w-4 text-gray-400" />
        )}
        {completed && (
          <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-green-600" />
        )}
        
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {letter}
        </div>
        
        {completed && (
          <div className="flex justify-center gap-1">
            {Array.from({ length: 3 }, (_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < stars ? 'text-yellow-500 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        )}
        
        {!unlocked && (
          <p className="text-xs text-gray-500 mt-2">Bloqueado</p>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para niveles de juego
interface GameLevelCardProps {
  id: number;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  unlocked: boolean;
  completed: boolean;
  stars: number;
  onSelect?: () => void;
}

export function GameLevelCard({ 
  id, 
  name, 
  description, 
  color, 
  bgColor, 
  unlocked, 
  completed, 
  stars, 
  onSelect 
}: GameLevelCardProps) {
  return (
    <Card 
      className={`relative transition-all hover:shadow-lg cursor-pointer ${
        !unlocked ? 'opacity-50' : 'hover:scale-105'
      }`}
      onClick={unlocked ? onSelect : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
            <span className="text-white font-bold text-lg">{id}</span>
          </div>
          {!unlocked && <Lock className="h-5 w-5 text-gray-400" />}
          {completed && (
            <div className="flex gap-1">
              {Array.from({ length: 3 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < stars ? 'text-yellow-500 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <CardTitle className={`text-lg ${color}`}>{name}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        
        {unlocked && (
          <Button 
            className="w-full" 
            variant={completed ? "outline" : "default"}
            onClick={onSelect}
          >
            <Play className="h-4 w-4 mr-2" />
            {completed ? 'Jugar de nuevo' : 'Comenzar'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para challenges/desafíos
interface ChallengeCardProps {
  id: string;
  title: string;
  description: string;
  target: number;
  icon: any;
  color: string;
  progress?: number;
  completed?: boolean;
  onStart?: () => void;
}

export function ChallengeCard({ 
  id, 
  title, 
  description, 
  target, 
  icon: IconComponent, 
  color, 
  progress = 0, 
  completed = false,
  onStart 
}: ChallengeCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
            <IconComponent className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          {completed && (
            <Trophy className="h-5 w-5 text-yellow-500 ml-auto" />
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {!completed && (
          <>
            <Progress value={(progress / target) * 100} className="mb-3" />
            <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
              <span>Progreso: {progress}/{target}</span>
              <span>{((progress / target) * 100).toFixed(2)}%</span>
            </div>
          </>
        )}
        
        <Button 
          variant={completed ? "outline" : "default"} 
          size="sm" 
          className="w-full"
          onClick={onStart}
          disabled={completed}
        >
          {completed ? 'Completado' : 'Comenzar'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Componente para estadísticas
interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: any;
  color?: string;
}

export function StatsCard({ title, value, description, icon: IconComponent, color = 'bg-blue-500' }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
          {IconComponent && (
            <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
              <IconComponent className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
