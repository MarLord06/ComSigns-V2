"use client"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export const useAuthRedirect = () => {
  const { user, profile, loading, isNewUser } = useAuth()
  const router = useRouter()

  const redirectToAppropriateRoute = () => {
    if (loading) return

    if (!user) {
      // Usuario no autenticado, mantener en página actual
      return
    }

    if (isNewUser || !profile) {
      // Nuevo usuario o sin perfil, ir al tutorial
      router.push('/tutorial/welcome')
      return
    }

    // Usuario existente con perfil, ir al dashboard
    router.push('/dashboard')
  }

  return {
    user,
    profile,
    loading,
    isNewUser,
    redirectToAppropriateRoute
  }
}
