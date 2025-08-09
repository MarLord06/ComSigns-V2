/**
 * Página de traducción refactorizada usando AppLayout
 */

"use client";

import { useRef, useState } from 'react';
import {
  TranslationLayout,
  CameraView,
  TranslationResult,
  ControlPanel,
  CameraViewRef
} from '@/components/translation';
import { AppLayout, HeroSection } from '@/components/layout';
import { useCamera, useTranslation, useBackendConnection } from '@/lib/hooks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function TranslatePage() {
  const cameraRef = useRef<CameraViewRef>(null);
  const [translationCount, setTranslationCount] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false); // Estado local para la cámara

  // Custom hooks para gestión de estado
  const {
    // Nuevas funciones de tiempo real
    isTranslating,
    currentPrediction,
    confidence,
    lastTranslation,
    startRealtimeTranslation,
    stopRealtimeTranslation
  } = useCamera();

  const { isConnected: isBackendConnected } = useBackendConnection();

  // Variables derivadas para compatibilidad con el componente
  const translationResult = lastTranslation;
  const translationError = '';
  const [cameraError, setCameraError] = useState('');

  // Gestión de errores combinados
  const hasError = cameraError || translationError;
  const errorMessage = cameraError || translationError || '';

  // Función de captura que usa el ref del componente
  const captureFrame = async () => {
    if (cameraRef.current) {
      return await cameraRef.current.captureFrame();
    }
    return null;
  };

  // Handlers
  const handleToggleCamera = async () => {
    console.log('[TRANSLATE] Toggle camera:', !isCameraActive);
    setIsCameraActive(!isCameraActive);
    
    // Si se desactiva la cámara, también detener la traducción
    if (isCameraActive && isTranslating) {
      console.log('[TRANSLATE] Deteniendo traducción por cámara desactivada');
      stopRealtimeTranslation();
    }
  };

  const handleToggleTranslation = () => {
    console.log('[TRANSLATE] Toggle translation, current isTranslating:', isTranslating);
    console.log('[TRANSLATE] cameraRef.current existe:', !!cameraRef.current);
    console.log('[TRANSLATE] isCameraActive:', isCameraActive);
    if (isTranslating) {
      stopRealtimeTranslation();
    } else {
      if (!isCameraActive) {
        console.warn('[TRANSLATE] Cámara no está activa, la traducción puede no funcionar');
      }
      // Pasar el cameraRef completo al hook
      console.log('[TRANSLATE] Iniciando traducción, cameraRef.current:', !!cameraRef.current);
      startRealtimeTranslation(cameraRef);
      setTranslationCount(prev => prev + 1);
    }
  };

  return (
    <AppLayout currentPage="translate">
      {/* Alerta global de errores */}
      {hasError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Hero Section */}
      <HeroSection
        title="Traductor de Lenguaje de Señas"
        subtitle="Traduce señas en tiempo real usando inteligencia artificial"
      />

      {/* Layout principal de traducción */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <TranslationLayout
            cameraView={
              <CameraView 
                ref={cameraRef}
                isActive={isCameraActive}
                onError={setCameraError}
              />
            }
            controlPanel={
              <ControlPanel
                isTranslating={isTranslating}
                isCameraActive={isCameraActive}
                isBackendConnected={isBackendConnected}
                onToggleTranslation={handleToggleTranslation}
                onToggleCamera={handleToggleCamera}
                translationCount={translationCount}
              />
            }
            translationResult={
              <TranslationResult
                result={translationResult}
                isProcessing={isTranslating && isCameraActive}
                currentPrediction={currentPrediction}
                confidence={confidence}
              />
            }
          />
        </div>
      </section>
    </AppLayout>
  );
}
