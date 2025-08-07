'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireProfile?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/auth/login',
  requireProfile = true 
}) => {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
        return
      }

      if (requireProfile && !profile) {
        // Si el usuario existe pero no tiene perfil, algo salió mal
        console.error('Usuario sin perfil encontrado')
        router.push(redirectTo)
        return
      }
    }
  }, [user, profile, loading, router, redirectTo, requireProfile])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!user || (requireProfile && !profile)) {
    return null
  }

  return <>{children}</>
}
