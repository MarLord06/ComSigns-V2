/**
 * FrameCaptureService - Servicio especializado para captura y procesamiento de frames
 * Optimiza la captura, redimensionado y conversión de frames de video
 */

export interface FrameCaptureOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  interval?: number;
  enableOptimizations?: boolean;
}

export interface CapturedFrame {
  base64: string;
  blob: Blob;
  width: number;
  height: number;
  timestamp: number;
  size: number;
}

export interface FrameStats {
  totalFrames: number;
  averageSize: number;
  averageProcessingTime: number;
  droppedFrames: number;
}

export class FrameCaptureService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: Required<FrameCaptureOptions>;
  private stats: FrameStats;
  private isCapturing = false;
  private captureInterval: NodeJS.Timeout | null = null;
  private onFrameCallback?: (frame: CapturedFrame) => void;
  private lastCaptureTime = 0;

  constructor(options: FrameCaptureOptions = {}) {
    this.options = {
      width: 640,
      height: 480,
      quality: 0.8,
      format: 'jpeg',
      interval: 200,
      enableOptimizations: true,
      ...options
    };

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    
    this.stats = {
      totalFrames: 0,
      averageSize: 0,
      averageProcessingTime: 0,
      droppedFrames: 0
    };

    // Configurar canvas para optimizaciones
    if (this.options.enableOptimizations) {
      this.setupCanvasOptimizations();
    }
  }

  /**
   * Captura un frame único de un elemento de video
   */
  public async captureFrame(videoElement: HTMLVideoElement): Promise<CapturedFrame | null> {
    const startTime = performance.now();

    try {
      // Verificar que el video esté listo
      if (!videoElement || videoElement.readyState < 2) {
        this.stats.droppedFrames++;
        return null;
      }

      // Configurar canvas con las dimensiones optimizadas
      const { width, height } = this.calculateOptimalDimensions(
        videoElement.videoWidth,
        videoElement.videoHeight
      );

      this.canvas.width = width;
      this.canvas.height = height;

      // Dibujar frame con optimizaciones
      this.drawOptimizedFrame(videoElement, width, height);

      // Convertir a blob y base64
      const frame = await this.convertToFrame(width, height);
      
      // Actualizar estadísticas
      const processingTime = performance.now() - startTime;
      this.updateStats(frame.size, processingTime);

      return frame;

    } catch (error) {
      console.error('[FrameCaptureService] Error capturando frame:', error);
      this.stats.droppedFrames++;
      return null;
    }
  }

  /**
   * Inicia captura continua de frames
   */
  public startContinuousCapture(
    videoElement: HTMLVideoElement,
    onFrame: (frame: CapturedFrame) => void
  ): void {
    if (this.isCapturing) {
      this.stopContinuousCapture();
    }

    this.isCapturing = true;
    this.onFrameCallback = onFrame;

    this.captureInterval = setInterval(async () => {
      // Control de throttling para evitar sobrecarga
      const now = Date.now();
      if (now - this.lastCaptureTime < this.options.interval) {
        return;
      }

      // Verificar que el video esté listo antes de capturar
      if (videoElement.readyState < 2) {
        return;
      }

      const frame = await this.captureFrame(videoElement);
      if (frame && this.onFrameCallback) {
        this.onFrameCallback(frame);
        this.lastCaptureTime = now;
      }
    }, Math.max(this.options.interval, 100)); // Mínimo 100ms entre capturas
  }

  /**
   * Detiene la captura continua
   */
  public stopContinuousCapture(): void {
    this.isCapturing = false;
    
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    this.onFrameCallback = undefined;
  }

  /**
   * Redimensiona un frame a dimensiones específicas
   */
  public async resizeFrame(
    frame: CapturedFrame,
    newWidth: number,
    newHeight: number
  ): Promise<CapturedFrame> {
    // Crear un canvas temporal para el redimensionado
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    // Crear imagen desde base64
    const img = new Image();
    img.src = `data:image/${this.options.format};base64,${frame.base64}`;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Dibujar redimensionado
    tempCtx.drawImage(img, 0, 0, newWidth, newHeight);

    // Convertir a nuevo frame
    return this.convertCanvasToFrame(tempCanvas, newWidth, newHeight);
  }

  /**
   * Optimiza un frame para transmisión (reduce calidad si es necesario)
   */
  public async optimizeForTransmission(frame: CapturedFrame, maxSizeKB: number = 50): Promise<CapturedFrame> {
    if (frame.size <= maxSizeKB * 1024) {
      return frame; // Ya está dentro del límite
    }

    // Reducir calidad gradualmente hasta alcanzar el tamaño objetivo
    let quality = this.options.quality;
    let optimizedFrame = frame;

    while (optimizedFrame.size > maxSizeKB * 1024 && quality > 0.1) {
      quality -= 0.1;
      
      // Recrear canvas con menor calidad
      this.canvas.width = frame.width;
      this.canvas.height = frame.height;
      
      // Dibujar desde el frame original
      const img = new Image();
      img.src = `data:image/${this.options.format};base64,${frame.base64}`;
      
      await new Promise((resolve) => {
        img.onload = () => {
          this.ctx.drawImage(img, 0, 0);
          resolve(null);
        };
      });

      optimizedFrame = await this.convertToFrame(frame.width, frame.height, quality);
    }

    return optimizedFrame;
  }

  /**
   * Obtiene estadísticas de captura
   */
  public getStats(): FrameStats {
    return { ...this.stats };
  }

  /**
   * Resetea estadísticas
   */
  public resetStats(): void {
    this.stats = {
      totalFrames: 0,
      averageSize: 0,
      averageProcessingTime: 0,
      droppedFrames: 0
    };
  }

  /**
   * Limpia recursos
   */
  public cleanup(): void {
    this.stopContinuousCapture();
    this.resetStats();
  }

  // Métodos privados
  private setupCanvasOptimizations(): void {
    // Configurar canvas para mejor rendimiento
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.imageSmoothingQuality = 'low';
    
    // Configurar atributos del canvas para optimización
    this.canvas.style.imageRendering = 'pixelated';
  }

  private calculateOptimalDimensions(videoWidth: number, videoHeight: number): { width: number; height: number } {
    const targetWidth = this.options.width;
    const targetHeight = this.options.height;
    
    // Mantener aspect ratio si está habilitado
    const videoAspect = videoWidth / videoHeight;
    const targetAspect = targetWidth / targetHeight;
    
    if (videoAspect > targetAspect) {
      // Video es más ancho
      return {
        width: targetWidth,
        height: Math.round(targetWidth / videoAspect)
      };
    } else {
      // Video es más alto
      return {
        width: Math.round(targetHeight * videoAspect),
        height: targetHeight
      };
    }
  }

  private drawOptimizedFrame(videoElement: HTMLVideoElement, width: number, height: number): void {
    // Aplicar filtros y optimizaciones antes del dibujo
    if (this.options.enableOptimizations) {
      this.ctx.filter = 'contrast(1.1) brightness(1.05)';
    }
    
    this.ctx.drawImage(videoElement, 0, 0, width, height);
    
    // Resetear filtros
    this.ctx.filter = 'none';
  }

  private async convertToFrame(width: number, height: number, quality?: number): Promise<CapturedFrame> {
    return this.convertCanvasToFrame(this.canvas, width, height, quality);
  }

  private async convertCanvasToFrame(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    quality: number = this.options.quality
  ): Promise<CapturedFrame> {
    // Convertir a blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob!),
        `image/${this.options.format}`,
        quality
      );
    });

    // Convertir a base64
    const dataUrl = canvas.toDataURL(`image/${this.options.format}`, quality);
    const base64 = dataUrl.split(',')[1];

    return {
      base64,
      blob,
      width,
      height,
      timestamp: Date.now(),
      size: blob.size
    };
  }

  private updateStats(frameSize: number, processingTime: number): void {
    this.stats.totalFrames++;
    
    // Calcular promedios de manera incremental
    const n = this.stats.totalFrames;
    this.stats.averageSize = ((this.stats.averageSize * (n - 1)) + frameSize) / n;
    this.stats.averageProcessingTime = ((this.stats.averageProcessingTime * (n - 1)) + processingTime) / n;
  }
}

export default FrameCaptureService;
