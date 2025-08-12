'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthDebugPage() {
  const [status, setStatus] = useState('Inicializando...')
  const [logs, setLogs] = useState<string[]>([])
  const [sessionInfo, setSessionInfo] = useState<any>(null)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const forceLogout = async () => {
    addLog('🧹 Forzando logout y limpieza de sesión...')
    await supabase.auth.signOut()
    
    // Limpiar storage adicional si es necesario
    localStorage.clear()
    sessionStorage.clear()
    
    addLog('✅ Sesión limpiada, recargando página...')
    window.location.reload()
  }

  useEffect(() => {
    const testAuth = async () => {
      try {
        addLog('🚀 Iniciando prueba de autenticación')
        
        // Test 1: Variables de entorno
        addLog(`📋 SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING'}`)
        addLog(`📋 SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING'}`)
        
        // Test 2: Cliente de Supabase
        addLog('🔌 Probando cliente de Supabase...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          addLog(`❌ Error obteniendo sesión: ${error.message}`)
          setStatus('Error de conexión')
          return
        }
        
        addLog(`✅ Sesión obtenida: ${session ? 'Usuario autenticado' : 'Sin sesión activa'}`)
        
        if (session) {
          setSessionInfo({
            userId: session.user?.id,
            email: session.user?.email,
            createdAt: session.user?.created_at
          })
          addLog(`👤 Usuario ID: ${session.user?.id}`)
          addLog(`📧 Email: ${session.user?.email}`)
        }
        
        // Test 3: Conexión a la base de datos
        addLog('🗄️ Probando conexión a base de datos...')
        const { data, error: dbError } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1)
        
        if (dbError) {
          addLog(`❌ Error tabla user_profiles: ${dbError.message}`)
          setStatus('Error de base de datos')
          return
        }
        
        addLog('✅ Tabla user_profiles accesible')
        
        // Test 4: Probar tabla game_attempts
        addLog('🎮 Probando tabla game_attempts...')
        const { data: gameData, error: gameError } = await supabase
          .from('game_attempts')
          .select('id')
          .limit(1)
        
        if (gameError) {
          addLog(`❌ Error tabla game_attempts: ${gameError.message}`)
          setStatus('Error en tabla game_attempts')
          return
        }
        
        addLog('✅ Tabla game_attempts accesible')
        setStatus('✅ Todo funcionando correctamente')
        
      } catch (error) {
        addLog(`💥 Error inesperado: ${error}`)
        setStatus('Error inesperado')
      }
    }

    testAuth()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Debug de Autenticación</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Estado Actual</h2>
          <div className={`text-lg font-medium mb-4 ${
            status.includes('✅') ? 'text-green-600' : 
            status.includes('❌') ? 'text-red-600' : 
            'text-yellow-600'
          }`}>
            {status}
          </div>
          
          {sessionInfo && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <h3 className="font-semibold text-red-800 mb-2">⚠️ Sesión Fantasma Detectada</h3>
              <p className="text-sm text-red-700 mb-3">
                Hay una sesión activa pero posiblemente el usuario fue eliminado de Supabase.
              </p>
              <button
                onClick={forceLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
              >
                🧹 Limpiar Sesión y Recargar
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Logs de Prueba</h2>
          <div className="space-y-2 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">Ejecutando pruebas...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-gray-700">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
