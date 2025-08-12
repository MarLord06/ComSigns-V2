/**
 * Componente para mostrar resultados de traducción
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TranslationResponse } from '@/lib/services/translation.service';
import { Clock, Hand } from 'lucide-react';
import { formatConfidence } from '@/lib/utils';

interface TranslationResultProps {
  result: TranslationResponse | null;
  isProcessing?: boolean;
  className?: string;
  // Nuevas propiedades para tiempo real
  currentPrediction?: string;
  confidence?: number;
}

export function TranslationResult({ 
  result, 
  isProcessing, 
  className, 
  currentPrediction = '', 
  confidence = 0 
}: TranslationResultProps) {
  // Mostrar predicción en tiempo real si está procesando
  if (isProcessing) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            Traduciendo en tiempo real...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Predicción actual */}
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">
              {currentPrediction || '?'}
            </div>
            {confidence > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">Confianza:</span>
                  <span className="font-medium">{formatConfidence(confidence)}</span>
                </div>
                <Progress value={confidence * 100} className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result && !isProcessing) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Hand className="h-12 w-12 mx-auto mb-4" />
            <p>Muestra tu mano para comenzar la traducción</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const getStatusBadge = (success: boolean) => {
    if (success) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Éxito</Badge>;
    } else {
      return <Badge variant="destructive">Sin detección</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Resultado de Traducción</span>
          {getStatusBadge(result.success)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.success && result.result ? (
          <>
            {/* Texto detectado */}
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">
                {result.result.text || '?'}
              </div>
              <p className="text-sm text-muted-foreground">Texto detectado</p>
            </div>

            {/* Confianza */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confianza</span>
                <span>{formatConfidence(result.result.confidence)}</span>
              </div>
              <Progress 
                value={result.result.confidence * 100} 
                className="h-2"
              />
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{result.result.processing_time_ms}ms</span>
              </div>
              <div className="flex items-center gap-2">
                <Hand className="h-4 w-4 text-muted-foreground" />
                <span>{result.result.signs_detected} señal(es)</span>
              </div>
            </div>

            {/* Predicciones detalladas */}
            {result.result.detailed_predictions && result.result.detailed_predictions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Predicciones detalladas:</h4>
                <div className="space-y-1">
                  {result.result.detailed_predictions.map((pred, index) => (
                    <div key={index} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                      <span className="font-medium">{pred.sign}</span>
                      <span>{formatConfidence(pred.confidence)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>{result.message || 'No se detectaron señales válidas'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
