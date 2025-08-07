'use client'

export default function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Variables de Entorno</h1>
      <div className="space-y-2">
        <p><strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'No definida'}</p>
        <p><strong>SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Definida' : 'No definida'}</p>
        <p><strong>API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'No definida'}</p>
      </div>
    </div>
  )
}
