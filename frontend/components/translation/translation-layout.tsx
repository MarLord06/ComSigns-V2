/**
 * Layout principal para la página de traducción
 */

import { ReactNode } from 'react';

interface TranslationLayoutProps {
  cameraView: ReactNode;
  translationResult: ReactNode;
  controlPanel: ReactNode;
  className?: string;
}

export function TranslationLayout({
  cameraView,
  translationResult,
  controlPanel,
  className
}: TranslationLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Vista de cámara - Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Traductor de Lenguaje de Señas
              </h1>
              <p className="text-gray-600">
                Muestra tu mano para traducir letras del alfabeto de señas
              </p>
            </div>
            
            {/* Cámara */}
            <div className="bg-white rounded-xl shadow-lg p-1">
              {cameraView}
            </div>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Panel de control */}
            <div className="bg-white rounded-xl shadow-lg p-1">
              {controlPanel}
            </div>
            
            {/* Resultado de traducción */}
            <div className="bg-white rounded-xl shadow-lg p-1">
              {translationResult}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
