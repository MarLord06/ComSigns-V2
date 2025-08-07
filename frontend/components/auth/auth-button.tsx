'use client'

import React, { useState } from 'react'
import { LogIn, User, LogOut, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export const AuthButton: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, profile, signOut, loading } = useAuth()

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="w-24 h-10 bg-gray-200 rounded-md"></div>
      </div>
    )
  }

  if (user && profile) {
    return (
      <div className="relative">
        <Button
          onClick={() => setShowUserMenu(!showUserMenu)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <User size={18} />
          <span className="hidden sm:inline">{profile.username}</span>
        </Button>

        {showUserMenu && (
          <>
            {/* Overlay para cerrar el menú */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowUserMenu(false)}
            />
            
            {/* Menú desplegable */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <BarChart3 size={16} />
                  Dashboard
                </Link>
                
                <button
                  onClick={() => {
                    signOut()
                    setShowUserMenu(false)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <Link href="/auth/login">
      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
        <LogIn size={18} className="mr-2" />
        Iniciar Sesión
      </Button>
    </Link>
  )
}
