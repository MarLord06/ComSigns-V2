import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Tipos para el usuario extendido
export interface UserProfile {
  id: string
  username: string
  full_name: string
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
  avatar_url?: string | null
  total_points: number
  current_level: number
  games_played: number
  accuracy_percentage: number
  longest_streak: number
  current_streak: number
  is_active: boolean
  updated_at: string
}

// Tipos para estadísticas del usuario
export interface UserStats {
  total_sessions: number
  total_practice_time: number
  letters_completed: string[]
  average_accuracy: number
  current_streak: number
  best_streak: number
  total_points: number
  level: number
}
