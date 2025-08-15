'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, UserProfile, UserStats } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  stats: UserStats | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>
  signUp: (email: string, password: string, username: string, fullName: string, experienceLevel: string) => Promise<{ error: AuthError | Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
  refreshStats: () => Promise<void>
  isNewUser: boolean
  completeTutorial: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  // Un usuario es nuevo si no tiene estadísticas o tiene 0 sesiones
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    console.log('Initializing auth...')
    
    // Obtener sesión inicial
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        return
      }

      console.log('Initial session:', session ? 'Found' : 'Not found')
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('User found, loading profile and stats...')
        await loadUserProfile(session.user.id)
        await loadUserStats(session.user.id)
      }
      
      setLoading(false)
      console.log('Auth initialization complete')
    }

    getSession()

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('Loading user data...')
  loadUserProfile(session.user.id) // Quitar await para evitar bloqueos
  loadUserStats(session.user.id)   // Quitar await para evitar bloqueos
      } else {
        setProfile(null)
        setStats(null)
        setIsNewUser(false)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Dependencias vacías para ejecutar solo una vez

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error loading profile:', error)
        // Si hay error grave, limpiar sesión
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log('Forcing logout due to profile error')
          await supabase.auth.signOut()
        }
        return
      }

      if (!data) {
        console.log('No profile found for user, user might have been deleted')
        // Usuario eliminado, limpiar sesión
        await supabase.auth.signOut()
        return
      }

      console.log('Profile data:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
      // En caso de error, limpiar sesión para evitar loops
      await supabase.auth.signOut()
    }
  }

  const loadUserStats = async (userId: string) => {
    try {
      console.log('Loading stats for user:', userId)
      
      // Obtener estadísticas de game_attempts (nueva estructura simplificada)
      const { data: attemptsData, error } = await supabase
        .from('game_attempts')
        .select('points_earned, is_correct, time_taken_seconds')
        .eq('user_id', userId)
      
      if (error) {
        console.log('No stats yet, using defaults:', error)
        // Establecer stats por defecto
        setStats({
          total_sessions: 0,
          total_practice_time: 0,
          letters_completed: [],
          average_accuracy: 0,
          current_streak: 0,
          best_streak: 0,
          total_points: 0,
          level: 1
        })
        setIsNewUser(true)
        return
      }

      console.log('Attempts data:', attemptsData)

      // Calcular estadísticas o usar datos mock
  if (attemptsData && attemptsData.length > 0) {
        const correctAttempts = attemptsData.filter(a => a.is_correct)
        const stats = {
          total_sessions: attemptsData.length,
          total_practice_time: attemptsData.reduce((sum, result) => sum + (result.time_taken_seconds || 0), 0),
          letters_completed: [],
          average_accuracy: correctAttempts.length / attemptsData.length,
          current_streak: 0,
          best_streak: 0,
          total_points: attemptsData.reduce((sum, result) => sum + (result.points_earned || 0), 0),
          level: Math.floor(attemptsData.reduce((sum, result) => sum + (result.points_earned || 0), 0) / 100) + 1
        }
  setStats(stats)
  setIsNewUser(stats.total_sessions === 0)
  console.log('Stats loaded successfully:', stats)
      } else {
        // Usuario nuevo sin estadísticas
        const defaultStats = {
          total_sessions: 0,
          total_practice_time: 0,
          letters_completed: [],
          average_accuracy: 0,
          current_streak: 0,
          best_streak: 0,
          total_points: 0,
          level: 1
        }
        setStats(defaultStats)
        setIsNewUser(true)
        console.log('Using default stats for new user')
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      // Datos por defecto para usuarios nuevos
      setStats({
        total_sessions: 0,
        total_practice_time: 0,
        letters_completed: [],
        average_accuracy: 0,
        current_streak: 0,
        best_streak: 0,
        total_points: 0,
        level: 1
      })
    }
  }

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      console.log('Attempting login for:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        console.error('Login error:', error)
        if (error.message.includes('Email not confirmed')) {
          console.error('Email needs confirmation')
          return { error: {
            name: 'AuthError',
            message: 'Confirma tu email antes de iniciar sesión',
            status: 400,
            code: 'email_not_confirmed',
            __isAuthError: true
          } as unknown as AuthError }
        }
        if (error.message.includes('Invalid login credentials')) {
          console.error('Invalid credentials')
          return { error: {
            name: 'AuthError',
            message: 'Email o contraseña incorrectos',
            status: 400,
            code: 'invalid_login',
            __isAuthError: true
          } as unknown as AuthError }
        }
        return { error }
      }
      console.log('Login successful:', data.user?.email)
      return { error: null }
    } catch (err) {
      console.error('Unexpected login error:', err)
      return { error: {
        name: 'AuthError',
        message: err instanceof Error ? err.message : 'Unknown error',
        status: 400,
        code: 'unexpected',
        __isAuthError: true
      } as unknown as AuthError }
    }
  }

  const signUp = async (
    email: string, 
    password: string, 
    username: string, 
    fullName: string, 
    experienceLevel: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            experience_level: experienceLevel,
          },
        },
      })

      if (error) {
        console.error('Auth signup error:', error)
        return { error }
      }

      if (!data.user) {
        console.error('No user data returned')
        return { error: {
          name: 'AuthError',
          message: 'No user data returned',
          status: 400,
          code: 'no_user',
          __isAuthError: true
        } as unknown as AuthError }
      }

      // Crear perfil en la tabla user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          username,
          full_name: fullName,
          experience_level: experienceLevel,
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        if (profileError.code === '42P01') {
          console.error('La tabla profiles no existe. Ejecuta el schema de Supabase.')
          return { error: {
            name: 'AuthError',
            message: 'Database not configured. Please contact support.',
            status: 500,
            code: 'db_not_configured',
            __isAuthError: true
          } as unknown as AuthError }
        }
        return { error: profileError }
      }

      console.log('User and profile created successfully')
      return { error: null }
    } catch (err) {
      console.error('Unexpected signup error:', err)
      return { error: {
        name: 'AuthError',
        message: err instanceof Error ? err.message : 'Unknown error',
        status: 400,
        code: 'unexpected',
        __isAuthError: true
      } as unknown as AuthError }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null)
      }

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const refreshStats = async () => {
    if (user) {
      await loadUserStats(user.id)
    }
  }

  // Marcar tutorial como completado: simplemente refresca stats para que isNewUser se actualice
  const completeTutorial = async () => {
    if (user) {
      await refreshStats()
    }
  }

  const value = {
    user,
    session,
    profile,
    stats,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshStats,
    isNewUser,
    completeTutorial,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
