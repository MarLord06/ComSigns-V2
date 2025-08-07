'use client'

import React, { useState } from 'react'
import { X, Eye, EyeOff, User, Mail, Lock, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register'
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultTab = 'login' 
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { signIn, signUp } = useAuth()

  // Estados del formulario
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced'
  })

  if (!isOpen) return null

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Validaciones
    const newErrors: Record<string, string> = {}
    
    const emailError = validateEmail(loginForm.email)
    if (emailError) newErrors.email = emailError

    if (!loginForm.password) newErrors.password = 'La contraseña es requerida'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    const { error } = await signIn(loginForm.email, loginForm.password)
    
    if (error) {
      setErrors({ general: 'Email o contraseña incorrectos' })
    } else {
      onClose()
    }
    
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
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
      onClose()
    }
    
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {activeTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === 'register'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Error general */}
        {errors.general && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className={`w-full pl-10 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="usuario123"
                />
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fullName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Tu nombre completo"
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Experiencia
              </label>
              <select
                value={registerForm.experienceLevel}
                onChange={(e) => setRegisterForm({ 
                  ...registerForm, 
                  experienceLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className={`w-full pl-10 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Mínimo 8 caracteres, 1 número"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Repite tu contraseña"
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="px-6 pb-6 text-center text-sm text-gray-500">
          {activeTab === 'login' ? (
            <p>
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => setActiveTab('register')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Regístrate aquí
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => setActiveTab('login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Inicia sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
