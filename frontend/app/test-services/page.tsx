/**
 * Página de prueba para validar los nuevos servicios
 */

'use client';

import { useState } from 'react';
import { useAdvancedCamera } from '../../lib/hooks/use-advanced-camera-v2';

export default function TestServicesPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const camera = useAdvancedCamera({
    debug: true,
    cameraConstraints: {
      width: 640,
      height: 480,
      facingMode: 'user'
    }
  });

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testCameraService = async () => {
    addResult('🎥 Probando CameraService...');
    const success = await camera.initialize();
    if (success) {
      addResult('✅ CameraService: Inicialización exitosa');
    } else {
      addResult('❌ CameraService: Error en inicialización');
    }
  };

  const testWebSocketService = () => {
    addResult('🔌 Probando WebSocketService...');
    try {
      camera.startRealtimeTranslation();
      addResult('✅ WebSocketService: Iniciando conexión...');
      setTimeout(() => {
        camera.stopRealtimeTranslation();
        addResult('🔌 WebSocketService: Desconectado');
      }, 5000);
    } catch (error) {
      addResult('❌ WebSocketService: Error de conexión');
    }
  };

  const testFrameCapture = async () => {
    addResult('📷 Probando FrameCaptureService...');
    try {
      const frame = await camera.captureFrame();
      if (frame) {
        addResult(`✅ FrameCaptureService: Frame capturado (${frame.size} bytes)`);
      } else {
        addResult('❌ FrameCaptureService: No se pudo capturar frame');
      }
    } catch (error) {
      addResult(`❌ FrameCaptureService: Error - ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          🧪 Test de Nuevos Servicios
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Video */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📹 Vista de Cámara</h2>
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={camera.videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            </div>
            
            {/* Estados */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span>Estado Cámara:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  camera.permission === 'granted' ? 'bg-green-100 text-green-800' :
                  camera.permission === 'denied' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {camera.permission}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>WebSocket:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  camera.realtimeStatus === 'connected' ? 'bg-green-100 text-green-800' :
                  camera.realtimeStatus === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {camera.realtimeStatus}
                </span>
              </div>
              
              {camera.isTranslating && (
                <div className="flex justify-between">
                  <span>Predicción:</span>
                  <span className="font-bold text-lg">
                    {camera.currentPrediction || '...'} ({Math.round(camera.confidence * 100)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Panel de Controles */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🎮 Controles de Prueba</h2>
            
            <div className="space-y-4">
              <button
                onClick={testCameraService}
                disabled={camera.isInitializing}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {camera.isInitializing ? '⏳ Iniciando...' : '🎥 Probar CameraService'}
              </button>

              <button
                onClick={testWebSocketService}
                disabled={camera.permission !== 'granted' || camera.isTranslating}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {camera.isTranslating ? '🔄 Traduciendo...' : '🔌 Probar WebSocket'}
              </button>

              <button
                onClick={testFrameCapture}
                disabled={camera.permission !== 'granted'}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📷 Probar Captura Frame
              </button>

              <button
                onClick={() => camera.cleanup()}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🧹 Limpiar Recursos
              </button>

              <button
                onClick={clearResults}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🗑️ Limpiar Resultados
              </button>
            </div>

            {/* Información de Servicios */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">📊 Info de Servicios</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Soporte: {camera.isSupported ? '✅' : '❌'}</div>
                <div>Stats: {JSON.stringify(camera.getStats())}</div>
                <div>Error: {camera.error || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Log de Resultados */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📝 Resultados de Pruebas</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <div className="text-gray-500">No hay resultados aún... ¡Ejecuta algunas pruebas!</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
          <h3 className="font-semibold text-blue-800 mb-2">📋 Instrucciones de Prueba</h3>
          <ol className="text-blue-700 text-sm space-y-1">
            <li>1. Haz clic en "Probar CameraService" para inicializar la cámara</li>
            <li>2. Permite el acceso a la cámara cuando se solicite</li>
            <li>3. Prueba "Probar WebSocket" para verificar la conexión</li>
            <li>4. Usa "Probar Captura Frame" para verificar que los frames se capturan</li>
            <li>5. Observa la consola del navegador para logs detallados</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
