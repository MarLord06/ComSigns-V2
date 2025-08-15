/**
 * CameraService - Servicio independiente para gestión de cámara
 * Maneja permisos, inicialización, streams y configuraciones de video
 */

export type CameraPermission = 'prompt' | 'granted' | 'denied';
export type CameraStatus = 'idle' | 'initializing' | 'active' | 'error';

export interface CameraConstraints {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  frameRate?: number;
}

export interface CameraError {
  code: string;
  message: string;
  type: 'permission' | 'not-supported' | 'device' | 'unknown';
}

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private status: CameraStatus = 'idle';
  private permission: CameraPermission = 'prompt';
  private constraints: CameraConstraints;

  constructor(constraints: CameraConstraints = {}) {
    this.constraints = {
      width: 640,
      height: 480,
      facingMode: 'user',
      frameRate: 30,
      ...constraints
    };
  }

  /**
   * Verifica si el navegador soporta getUserMedia
   */
  public isSupported(): boolean {
    return !!(navigator.mediaDevices?.getUserMedia);
  }

  /**
   * Verifica el estado actual de los permisos
   */
  public async checkPermissions(): Promise<CameraPermission> {
    if (!this.isSupported()) {
      this.permission = 'denied';
      return this.permission;
    }

    try {
      const result = await navigator.permissions?.query({ name: 'camera' as PermissionName });
      this.permission = result?.state === 'granted' ? 'granted' : 
                       result?.state === 'denied' ? 'denied' : 'prompt';
    } catch {
      // Si no se puede verificar, asumimos prompt
      this.permission = 'prompt';
    }

    return this.permission;
  }

  /**
   * Inicializa la cámara y obtiene el stream
   */
  public async initialize(): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw this.createError('not-supported', 'Camera not supported in this browser');
    }

    if (this.stream) {
      return this.stream;
    }

    this.status = 'initializing';

    try {
      const mediaConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: this.constraints.width },
          height: { ideal: this.constraints.height },
          facingMode: this.constraints.facingMode,
          frameRate: { ideal: this.constraints.frameRate }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      this.permission = 'granted';
      this.status = 'active';

      // Configurar event listeners para el stream
      this.stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          this.handleStreamEnded();
        });
      });

      return this.stream;
    } catch (error: unknown) {
      this.status = 'error';
      this.permission = 'denied';
      throw this.handleInitError(error);
    }
  }

  /**
   * Conecta el stream a un elemento de video
   */
  public attachToVideo(videoElement: HTMLVideoElement): void {
    if (!this.stream) {
      throw this.createError('device', 'No active stream to attach');
    }

    this.videoElement = videoElement;
    videoElement.srcObject = this.stream;
    
    // Configurar el video para reproducción automática
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.muted = true;
    
    // Forzar la reproducción si no inicia automáticamente
    videoElement.addEventListener('loadedmetadata', () => {
      videoElement.play().catch(console.error);
    });
    
    // Reproducir inmediatamente si ya tiene metadata
    if (videoElement.readyState >= 1) {
      videoElement.play().catch(console.error);
    }
  }

  /**
   * Desconecta y limpia recursos
   */
  public cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.status = 'idle';
  }

  /**
   * Captura un frame actual como File
   */
  public captureFrame(quality: number = 0.8): Promise<File | null> {
    return new Promise((resolve) => {
      if (!this.videoElement || this.videoElement.readyState < 2) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(null);
        return;
      }

      canvas.width = this.videoElement.videoWidth;
      canvas.height = this.videoElement.videoHeight;
      
      ctx.drawImage(this.videoElement, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], 'frame.jpg', { type: 'image/jpeg' }));
          } else {
            resolve(null);
          }
        },
        'image/jpeg',
        quality
      );
    });
  }

  /**
   * Obtiene información sobre los dispositivos disponibles
   */
  public async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
    if (!this.isSupported()) return [];
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch {
      return [];
    }
  }

  // Getters
  public getStatus(): CameraStatus { return this.status; }
  public getPermission(): CameraPermission { return this.permission; }
  public getStream(): MediaStream | null { return this.stream; }
  public getVideoElement(): HTMLVideoElement | null { return this.videoElement; }
  public isActive(): boolean { return this.status === 'active' && !!this.stream; }

  // Métodos privados
  private createError(type: CameraError['type'], message: string): CameraError {
    return {
      code: type.toUpperCase(),
      message,
      type
    };
  }

  private handleInitError(error: unknown): CameraError {
    const err = error as Error;
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return this.createError('permission', 'Camera permission denied');
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return this.createError('device', 'No camera device found');
    }
    if (err.name === 'NotSupportedError') {
      return this.createError('not-supported', 'Camera not supported');
    }
    return this.createError('unknown', err.message || 'Unknown camera error');
  }

  private handleStreamEnded(): void {
    this.status = 'idle';
    this.stream = null;
  }
}

export default CameraService;
