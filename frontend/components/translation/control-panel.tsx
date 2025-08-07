/**
 * Panel de control para traducción
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Square, 
  Settings, 
  Wifi, 
  WifiOff,
  Camera,
  CameraOff 
} from 'lucide-react';

interface ControlPanelProps {
  isTranslating: boolean;
  isCameraActive: boolean;
  isBackendConnected: boolean;
  onToggleTranslation: () => void;
  onToggleCamera: () => void;
  onSettings?: () => void;
  translationCount?: number;
  className?: string;
}

export function ControlPanel({
  isTranslating,
  isCameraActive,
  isBackendConnected,
  onToggleTranslation,
  onToggleCamera,
  onSettings,
  translationCount = 0,
  className
}: ControlPanelProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Control</span>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isBackendConnected ? "default" : "destructive"}
              className="text-xs"
            >
              {isBackendConnected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Conectado
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Desconectado
                </>
              )}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles principales */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onToggleCamera}
            variant={isCameraActive ? "default" : "outline"}
            className="w-full"
            disabled={!isBackendConnected}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="h-4 w-4 mr-2" />
                Desactivar
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Activar Cámara
              </>
            )}
          </Button>

          <Button
            onClick={onToggleTranslation}
            variant={isTranslating ? "destructive" : "default"}
            className="w-full"
            disabled={!isCameraActive || !isBackendConnected}
          >
            {isTranslating ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Parar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </>
            )}
          </Button>
        </div>

        {/* Estado de traducción */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Traducción automática</span>
            <Switch 
              checked={isTranslating} 
              onCheckedChange={onToggleTranslation}
              disabled={!isCameraActive || !isBackendConnected}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Traducciones realizadas</span>
            <Badge variant="outline">{translationCount}</Badge>
          </div>
        </div>

        {/* Estado de conexión */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div 
                className={`h-2 w-2 rounded-full ${
                  isCameraActive ? 'bg-green-500' : 'bg-gray-300'
                }`} 
              />
              Cámara
            </div>
            <div className="flex items-center gap-1">
              <div 
                className={`h-2 w-2 rounded-full ${
                  isBackendConnected ? 'bg-green-500' : 'bg-red-500'
                }`} 
              />
              Backend
            </div>
          </div>
        </div>

        {/* Configuración */}
        {onSettings && (
          <Button
            onClick={onSettings}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
