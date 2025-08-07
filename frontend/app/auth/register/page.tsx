'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { 
  Hand, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  UserCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from 'lucide-react'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced'
  })

  const { signUp, user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (!/\d/.test(password)) return 'La contraseña debe contener al menos un número'
    return null
  }

  const validateUsername = (username: string): string | null => {
    if (username.length < 3) return 'El usuario debe tener al menos 3 caracteres'
    if (username.length > 30) return 'El usuario no puede tener más de 30 caracteres'
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Solo se permiten letras, números y guiones bajos'
    return null
  }

  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Ingresa un email válido'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Validaciones
    const newErrors: Record<string, string> = {}
    
    const emailError = validateEmail(registerForm.email)
    if (emailError) newErrors.email = emailError

    const passwordError = validatePassword(registerForm.password)
    if (passwordError) newErrors.password = passwordError

    if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    const usernameError = validateUsername(registerForm.username)
    if (usernameError) newErrors.username = usernameError

    if (!registerForm.fullName.trim()) newErrors.fullName = 'El nombre completo es requerido'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    const { error } = await signUp(
      registerForm.email,
      registerForm.password,
      registerForm.username,
      registerForm.fullName,
      registerForm.experienceLevel
    )
    
    if (error) {
      if (error.message.includes('User already registered')) {
        setErrors({ general: 'Este email ya está registrado' })
      } else if (error.message.includes('username')) {
        setErrors({ username: 'Este nombre de usuario ya está en uso' })
      } else {
        setErrors({ general: 'Error al crear la cuenta. Intenta de nuevo.' })
      }
    } else {
      // La redirección se maneja en el useEffect
    }
    
    setLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/\d/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(registerForm.password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center">
            <Hand className="h-12 w-12 text-blue-600" />
            <span className="ml-3 text-2xl font-bold text-gray-900">ComSigns</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      {/* Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          {/* Error general */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nombre de Usuario *
              </label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="usuario123"
                />
              </div>
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              <p className="mt-1 text-xs text-gray-500">3-30 caracteres, solo letras, números y guiones bajos</p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nombre Completo *
              </label>
              <div className="mt-1 relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.fullName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Tu nombre completo"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            {/* Experience Level */}
            <div>
              <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700">
                Nivel de Experiencia
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                value={registerForm.experienceLevel}
                onChange={(e) => setRegisterForm({ 
                  ...registerForm, 
                  experienceLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña *
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Mínimo 8 caracteres, 1 número"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              
              {/* Password strength indicator */}
              {registerForm.password && (
                <div className="mt-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 w-full rounded-full ${
                          level <= passwordStrength
                            ? passwordStrength <= 2
                              ? 'bg-red-400'
                              : passwordStrength <= 3
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center mt-1 space-x-2">
                    {registerForm.password.length >= 8 && (
                      <div className="flex items-center text-green-600 text-xs">
                        <CheckCircle size={12} className="mr-1" />
                        8+ caracteres
                      </div>
                    )}
                    {/\d/.test(registerForm.password) && (
                      <div className="flex items-center text-green-600 text-xs">
                        <CheckCircle size={12} className="mr-1" />
                        1 número
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña *
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Repite tu contraseña"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-gray-700">
                  Acepto los{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    términos y condiciones
                  </a>{' '}
                  y la{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-500">
                    política de privacidad
                  </a>
                </label>
              </div>
            </div>

            {/* Submit button */}
            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Crear Cuenta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O</span>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  ¿Ya tienes cuenta? Inicia sesión
                </Button>
              </Link>
            </div>
            
            <div className="mt-4">
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
