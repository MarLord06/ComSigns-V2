module.exports = {

"[project]/lib/services/camera.service.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * CameraService - Servicio independiente para gestión de cámara
 * Maneja permisos, inicialización, streams y configuraciones de video
 */ __turbopack_context__.s({
    "CameraService": (()=>CameraService),
    "default": (()=>__TURBOPACK__default__export__)
});
class CameraService {
    stream = null;
    videoElement = null;
    status = 'idle';
    permission = 'prompt';
    constraints;
    constructor(constraints = {}){
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
   */ isSupported() {
        return !!navigator.mediaDevices?.getUserMedia;
    }
    /**
   * Verifica el estado actual de los permisos
   */ async checkPermissions() {
        if (!this.isSupported()) {
            this.permission = 'denied';
            return this.permission;
        }
        try {
            const result = await navigator.permissions?.query({
                name: 'camera'
            });
            this.permission = result?.state === 'granted' ? 'granted' : result?.state === 'denied' ? 'denied' : 'prompt';
        } catch  {
            // Si no se puede verificar, asumimos prompt
            this.permission = 'prompt';
        }
        return this.permission;
    }
    /**
   * Inicializa la cámara y obtiene el stream
   */ async initialize() {
        if (!this.isSupported()) {
            throw this.createError('not-supported', 'Camera not supported in this browser');
        }
        if (this.stream) {
            return this.stream;
        }
        this.status = 'initializing';
        try {
            const mediaConstraints = {
                video: {
                    width: {
                        ideal: this.constraints.width
                    },
                    height: {
                        ideal: this.constraints.height
                    },
                    facingMode: this.constraints.facingMode,
                    frameRate: {
                        ideal: this.constraints.frameRate
                    }
                },
                audio: false
            };
            this.stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
            this.permission = 'granted';
            this.status = 'active';
            // Configurar event listeners para el stream
            this.stream.getTracks().forEach((track)=>{
                track.addEventListener('ended', ()=>{
                    this.handleStreamEnded();
                });
            });
            return this.stream;
        } catch (error) {
            this.status = 'error';
            this.permission = 'denied';
            throw this.handleInitError(error);
        }
    }
    /**
   * Conecta el stream a un elemento de video
   */ attachToVideo(videoElement) {
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
        videoElement.addEventListener('loadedmetadata', ()=>{
            videoElement.play().catch(console.error);
        });
        // Reproducir inmediatamente si ya tiene metadata
        if (videoElement.readyState >= 1) {
            videoElement.play().catch(console.error);
        }
    }
    /**
   * Desconecta y limpia recursos
   */ cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach((track)=>track.stop());
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
   */ captureFrame(quality = 0.8) {
        return new Promise((resolve)=>{
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
            canvas.toBlob((blob)=>{
                if (blob) {
                    resolve(new File([
                        blob
                    ], 'frame.jpg', {
                        type: 'image/jpeg'
                    }));
                } else {
                    resolve(null);
                }
            }, 'image/jpeg', quality);
        });
    }
    /**
   * Obtiene información sobre los dispositivos disponibles
   */ async getAvailableDevices() {
        if (!this.isSupported()) return [];
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter((device)=>device.kind === 'videoinput');
        } catch  {
            return [];
        }
    }
    // Getters
    getStatus() {
        return this.status;
    }
    getPermission() {
        return this.permission;
    }
    getStream() {
        return this.stream;
    }
    getVideoElement() {
        return this.videoElement;
    }
    isActive() {
        return this.status === 'active' && !!this.stream;
    }
    // Métodos privados
    createError(type, message) {
        return {
            code: type.toUpperCase(),
            message,
            type
        };
    }
    handleInitError(error) {
        const err = error;
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
    handleStreamEnded() {
        this.status = 'idle';
        this.stream = null;
    }
}
const __TURBOPACK__default__export__ = CameraService;
}}),
"[project]/lib/services/websocket.service.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * WebSocketService - Servicio genérico para conexiones WebSocket
 * Soporta reconexión automática, heartbeat y diferentes tipos de mensajes
 */ __turbopack_context__.s({
    "WebSocketService": (()=>WebSocketService),
    "default": (()=>__TURBOPACK__default__export__)
});
class WebSocketService {
    ws = null;
    options;
    callbacks = {};
    status = 'disconnected';
    reconnectAttempts = 0;
    reconnectTimeout = null;
    heartbeatInterval = null;
    isManualClose = false;
    constructor(options, callbacks = {}){
        this.options = {
            protocols: [],
            reconnect: true,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
            heartbeatInterval: 30000,
            debug: false,
            ...options
        };
        this.callbacks = callbacks;
    }
    /**
   * Establece la conexión WebSocket
   */ connect() {
        return new Promise((resolve, reject)=>{
            if (this.ws?.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }
            this.isManualClose = false;
            this.setStatus('connecting');
            if (this.options.debug) {
                console.log('[WebSocketService] Intentando conectar a:', this.options.url);
            }
            try {
                this.ws = new WebSocket(this.options.url, this.options.protocols);
                this.ws.onopen = ()=>{
                    if (this.options.debug) {
                        console.log('[WebSocketService] Conexión establecida');
                    }
                    this.reconnectAttempts = 0;
                    this.setStatus('connected');
                    this.startHeartbeat();
                    this.callbacks.onOpen?.();
                    resolve();
                };
                this.ws.onclose = (event)=>{
                    if (this.options.debug) {
                        console.log('[WebSocketService] Conexión cerrada:', event.code, event.reason);
                    }
                    this.cleanup();
                    this.callbacks.onClose?.(event);
                    // Solo reconectar si no fue un cierre manual y no es un error de protocolo
                    if (!this.isManualClose && this.options.reconnect && event.code !== 1002 && event.code !== 1005) {
                        this.scheduleReconnect();
                    } else {
                        this.setStatus('disconnected');
                    }
                };
                this.ws.onerror = (error)=>{
                    if (this.options.debug) {
                        console.error('[WebSocketService] Error de conexión:', error);
                    }
                    this.setStatus('error');
                    this.callbacks.onError?.(error);
                    reject(error);
                };
                this.ws.onmessage = (event)=>{
                    try {
                        const message = JSON.parse(event.data);
                        if (this.options.debug) {
                            console.log('[WebSocketService] Mensaje recibido:', message);
                        }
                        // Manejar mensajes de heartbeat
                        if (message.type === 'ping') {
                            this.send({
                                type: 'pong'
                            });
                            return;
                        }
                        this.callbacks.onMessage?.(message);
                    } catch (error) {
                        console.error('[WebSocketService] Error parsing message:', error);
                    }
                };
            } catch (error) {
                this.setStatus('error');
                reject(error);
            }
        });
    }
    /**
   * Cierra la conexión WebSocket
   */ disconnect() {
        this.isManualClose = true;
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.cleanup();
        if (this.ws) {
            this.ws.close(1000, 'Manual disconnect');
            this.ws = null;
        }
        this.setStatus('disconnected');
    }
    /**
   * Envía un mensaje a través del WebSocket
   */ send(message) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            if (this.options.debug) {
                console.warn('[WebSocketService] No se puede enviar mensaje, conexión no disponible');
            }
            return false;
        }
        try {
            const serialized = JSON.stringify(message);
            this.ws.send(serialized);
            if (this.options.debug) {
                console.log('[WebSocketService] Mensaje enviado:', message);
            }
            return true;
        } catch (error) {
            console.error('[WebSocketService] Error enviando mensaje:', error);
            return false;
        }
    }
    /**
   * Envía datos binarios (como frames de imagen)
   */ sendBinary(data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return false;
        }
        try {
            this.ws.send(data);
            return true;
        } catch (error) {
            console.error('[WebSocketService] Error enviando datos binarios:', error);
            return false;
        }
    }
    /**
   * Envía un frame como mensaje JSON con base64
   */ sendFrame(base64Data, metadata = {}) {
        return this.send({
            type: 'frame',
            data: base64Data,
            timestamp: Date.now(),
            ...metadata
        });
    }
    // Getters
    getStatus() {
        return this.status;
    }
    isConnected() {
        return this.status === 'connected';
    }
    getReconnectAttempts() {
        return this.reconnectAttempts;
    }
    // Métodos para actualizar callbacks dinámicamente
    updateCallbacks(newCallbacks) {
        this.callbacks = {
            ...this.callbacks,
            ...newCallbacks
        };
    }
    // Métodos privados
    setStatus(newStatus) {
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.callbacks.onStatusChange?.(newStatus);
        }
    }
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            if (this.options.debug) {
                console.log('[WebSocketService] Máximo de intentos de reconexión alcanzado');
            }
            this.setStatus('error');
            return;
        }
        this.setStatus('reconnecting');
        this.reconnectAttempts++;
        if (this.options.debug) {
            console.log(`[WebSocketService] Reconectando en ${this.options.reconnectInterval}ms (intento ${this.reconnectAttempts})`);
        }
        this.callbacks.onReconnect?.(this.reconnectAttempts);
        this.reconnectTimeout = setTimeout(()=>{
            this.connect().catch(()=>{
            // El error ya se maneja en connect()
            });
        }, this.options.reconnectInterval);
    }
    startHeartbeat() {
        if (this.options.heartbeatInterval <= 0) return;
        this.heartbeatInterval = setInterval(()=>{
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send({
                    type: 'ping',
                    timestamp: Date.now()
                });
            }
        }, this.options.heartbeatInterval);
    }
    cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
}
const __TURBOPACK__default__export__ = WebSocketService;
}}),
"[project]/lib/services/frame-capture.service.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * FrameCaptureService - Servicio especializado para captura y procesamiento de frames
 * Optimiza la captura, redimensionado y conversión de frames de video
 */ __turbopack_context__.s({
    "FrameCaptureService": (()=>FrameCaptureService),
    "default": (()=>__TURBOPACK__default__export__)
});
class FrameCaptureService {
    canvas;
    ctx;
    options;
    stats;
    isCapturing = false;
    captureInterval = null;
    onFrameCallback;
    lastCaptureTime = 0;
    constructor(options = {}){
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
        this.ctx = this.canvas.getContext('2d');
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
   */ async captureFrame(videoElement) {
        const startTime = performance.now();
        try {
            // Verificar que el video esté listo
            if (!videoElement || videoElement.readyState < 2) {
                this.stats.droppedFrames++;
                return null;
            }
            // Configurar canvas con las dimensiones optimizadas
            const { width, height } = this.calculateOptimalDimensions(videoElement.videoWidth, videoElement.videoHeight);
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
   */ startContinuousCapture(videoElement, onFrame) {
        if (this.isCapturing) {
            this.stopContinuousCapture();
        }
        this.isCapturing = true;
        this.onFrameCallback = onFrame;
        this.captureInterval = setInterval(async ()=>{
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
   */ stopContinuousCapture() {
        this.isCapturing = false;
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
        }
        this.onFrameCallback = undefined;
    }
    /**
   * Redimensiona un frame a dimensiones específicas
   */ async resizeFrame(frame, newWidth, newHeight) {
        // Crear un canvas temporal para el redimensionado
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        // Crear imagen desde base64
        const img = new Image();
        img.src = `data:image/${this.options.format};base64,${frame.base64}`;
        await new Promise((resolve)=>{
            img.onload = resolve;
        });
        // Dibujar redimensionado
        tempCtx.drawImage(img, 0, 0, newWidth, newHeight);
        // Convertir a nuevo frame
        return this.convertCanvasToFrame(tempCanvas, newWidth, newHeight);
    }
    /**
   * Optimiza un frame para transmisión (reduce calidad si es necesario)
   */ async optimizeForTransmission(frame, maxSizeKB = 50) {
        if (frame.size <= maxSizeKB * 1024) {
            return frame; // Ya está dentro del límite
        }
        // Reducir calidad gradualmente hasta alcanzar el tamaño objetivo
        let quality = this.options.quality;
        let optimizedFrame = frame;
        while(optimizedFrame.size > maxSizeKB * 1024 && quality > 0.1){
            quality -= 0.1;
            // Recrear canvas con menor calidad
            this.canvas.width = frame.width;
            this.canvas.height = frame.height;
            // Dibujar desde el frame original
            const img = new Image();
            img.src = `data:image/${this.options.format};base64,${frame.base64}`;
            await new Promise((resolve)=>{
                img.onload = ()=>{
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
   */ getStats() {
        return {
            ...this.stats
        };
    }
    /**
   * Resetea estadísticas
   */ resetStats() {
        this.stats = {
            totalFrames: 0,
            averageSize: 0,
            averageProcessingTime: 0,
            droppedFrames: 0
        };
    }
    /**
   * Limpia recursos
   */ cleanup() {
        this.stopContinuousCapture();
        this.resetStats();
    }
    // Métodos privados
    setupCanvasOptimizations() {
        // Configurar canvas para mejor rendimiento
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.imageSmoothingQuality = 'low';
        // Configurar atributos del canvas para optimización
        this.canvas.style.imageRendering = 'pixelated';
    }
    calculateOptimalDimensions(videoWidth, videoHeight) {
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
    drawOptimizedFrame(videoElement, width, height) {
        // Aplicar filtros y optimizaciones antes del dibujo
        if (this.options.enableOptimizations) {
            this.ctx.filter = 'contrast(1.1) brightness(1.05)';
        }
        this.ctx.drawImage(videoElement, 0, 0, width, height);
        // Resetear filtros
        this.ctx.filter = 'none';
    }
    async convertToFrame(width, height, quality) {
        return this.convertCanvasToFrame(this.canvas, width, height, quality);
    }
    async convertCanvasToFrame(canvas, width, height, quality = this.options.quality) {
        // Convertir a blob
        const blob = await new Promise((resolve)=>{
            canvas.toBlob((blob)=>resolve(blob), `image/${this.options.format}`, quality);
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
    updateStats(frameSize, processingTime) {
        this.stats.totalFrames++;
        // Calcular promedios de manera incremental
        const n = this.stats.totalFrames;
        this.stats.averageSize = (this.stats.averageSize * (n - 1) + frameSize) / n;
        this.stats.averageProcessingTime = (this.stats.averageProcessingTime * (n - 1) + processingTime) / n;
    }
}
const __TURBOPACK__default__export__ = FrameCaptureService;
}}),
"[project]/lib/services/index.ts [app-ssr] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Services Index - Exportaciones centralizadas de todos los servicios
 */ __turbopack_context__.s({
    "ServiceFactory": (()=>ServiceFactory)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$camera$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/services/camera.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$websocket$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/services/websocket.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$frame$2d$capture$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/services/frame-capture.service.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
class ServiceFactory {
    /**
   * Crea una instancia de CameraService con configuración por defecto
   */ static createCameraService(overrides) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$camera$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CameraService"](overrides);
    }
    /**
   * Crea una instancia de WebSocketService para ML predictions
   */ static createMLWebSocketService(baseUrl, debug = false) {
        const wsUrl = baseUrl.replace(/^https?:\/\//, 'ws://').replace(/\/$/, '');
        return new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$websocket$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketService"]({
            url: `${wsUrl}/api/v1/ml/predict`,
            reconnect: true,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
            heartbeatInterval: 30000,
            debug
        });
    }
    /**
   * Crea una instancia de FrameCaptureService optimizada para ML
   */ static createMLFrameCaptureService(overrides) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$frame$2d$capture$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FrameCaptureService"]({
            width: 640,
            height: 480,
            quality: 0.8,
            format: 'jpeg',
            interval: 200,
            enableOptimizations: true,
            ...overrides
        });
    }
}
}}),
"[project]/lib/services/index.ts [app-ssr] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$camera$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/services/camera.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$websocket$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/services/websocket.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$frame$2d$capture$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/services/frame-capture.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/services/index.ts [app-ssr] (ecmascript) <locals>");
}}),
"[project]/lib/hooks/use-advanced-camera.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * useAdvancedCamera - Hook refactorizado que usa los nuevos servicios
 * Mantenemos la misma API externa para compatibilidad
 */ __turbopack_context__.s({
    "useAdvancedCamera": (()=>useAdvancedCamera)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/lib/services/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/services/index.ts [app-ssr] (ecmascript) <locals>");
;
;
const useAdvancedCamera = (options = {})=>{
    // Estados principales
    const [permission, setPermission] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('prompt');
    const [cameraStatus, setCameraStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [wsStatus, setWsStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('disconnected');
    const [isTranslating, setIsTranslating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    // Estados de predicción
    const [currentPrediction, setCurrentPrediction] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [confidence, setConfidence] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [lastTranslation, setLastTranslation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [sessionId, setSessionId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    // Referencias a servicios
    const cameraService = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const wsService = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const frameCaptureService = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Debug logging
    const log = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((prefix, ...args)=>{
        if (options.debug) {
            console.log(`[${prefix}]`, ...args);
        }
    }, [
        options.debug
    ]);
    // Manejar mensajes WebSocket
    const handleWebSocketMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((message)=>{
        switch(message.type){
            case 'session':
                setSessionId(message.session_id || '');
                log('SESSION', 'ID:', message.session_id);
                break;
            case 'prediction':
                const prediction = {
                    letter: message.letter || '',
                    confidence: message.confidence || 0,
                    processing_time_ms: message.processing_time_ms,
                    landmarks_detected: message.landmarks_detected,
                    session_id: message.session_id
                };
                log('PREDICTION', prediction);
                setCurrentPrediction(prediction.letter);
                setConfidence(prediction.confidence);
                // Actualizar traducción si la confianza es alta
                if (prediction.confidence > 0.7) {
                    setLastTranslation((prev)=>prev + prediction.letter);
                }
                break;
            case 'error':
                log('WS_ERROR', message.message);
                setError(message.message || 'Error desconocido');
                break;
        }
    }, [
        log
    ]);
    // Inicializar servicios
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!cameraService.current) {
            cameraService.current = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ServiceFactory"].createCameraService(options.cameraConstraints);
            // Configurar callbacks de estado
            const checkStatus = ()=>{
                const status = cameraService.current?.getStatus() || 'idle';
                const perm = cameraService.current?.getPermission() || 'prompt';
                setCameraStatus(status);
                setPermission(perm);
            };
            // Verificar estado inicial
            checkStatus();
        }
        if (!wsService.current) {
            const apiBase = ("TURBOPACK compile-time value", "http://localhost:8000") || ("TURBOPACK compile-time value", "http://localhost:8000") || 'http://localhost:8000';
            wsService.current = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ServiceFactory"].createMLWebSocketService(apiBase, options.debug);
            // Configurar callbacks WebSocket
            wsService.current.updateCallbacks({
                onOpen: ()=>{
                    log('WS', 'Conectado');
                    setWsStatus('connected');
                },
                onClose: ()=>{
                    log('WS', 'Desconectado');
                    setWsStatus('disconnected');
                },
                onError: (error)=>{
                    log('WS', 'Error:', error);
                    setWsStatus('error');
                },
                onMessage: (message)=>{
                    log('WS', 'Mensaje recibido:', message);
                    handleWebSocketMessage(message);
                },
                onStatusChange: (status)=>{
                    setWsStatus(status);
                }
            });
        }
        if (!frameCaptureService.current) {
            frameCaptureService.current = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ServiceFactory"].createMLFrameCaptureService(options.captureOptions);
        }
        return ()=>{
            // Cleanup en unmount
            cameraService.current?.cleanup();
            wsService.current?.disconnect();
            frameCaptureService.current?.cleanup();
        };
    }, [
        options,
        log,
        handleWebSocketMessage
    ]);
    // Inicializar cámara
    const initialize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!cameraService.current || !videoRef.current) {
            setError('Servicios no disponibles');
            return false;
        }
        try {
            setError('');
            setCameraStatus('initializing');
            await cameraService.current.initialize();
            cameraService.current.attachToVideo(videoRef.current);
            setCameraStatus('active');
            setPermission('granted');
            log('CAMERA', 'Inicializada correctamente');
            return true;
        } catch (error) {
            const err = error;
            setCameraStatus('error');
            setPermission('denied');
            setError(err.message || 'Error al inicializar cámara');
            log('CAMERA', 'Error:', error);
            return false;
        }
    }, [
        log
    ]);
    // Conectar WebSocket
    const connectRealtime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!wsService.current) return false;
        try {
            await wsService.current.connect();
            return true;
        } catch (error) {
            log('WS', 'Error conectando:', error);
            return false;
        }
    }, [
        log
    ]);
    // Iniciar traducción en tiempo real
    const startRealtimeTranslation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (isTranslating || !videoRef.current || !frameCaptureService.current) {
            return false;
        }
        log('REALTIME', 'Iniciando traducción');
        // Conectar WebSocket
        const connected = await connectRealtime();
        if (!connected) {
            setError('No se pudo conectar al servicio');
            return false;
        }
        // Esperar un poco para que el WebSocket se estabilice
        await new Promise((resolve)=>setTimeout(resolve, 500));
        setIsTranslating(true);
        setCurrentPrediction('');
        setConfidence(0);
        setError('');
        // Iniciar captura continua con delay inicial
        setTimeout(()=>{
            if (frameCaptureService.current && wsService.current?.isConnected()) {
                frameCaptureService.current.startContinuousCapture(videoRef.current, (frame)=>{
                    if (wsService.current?.isConnected()) {
                        const sent = wsService.current.sendFrame(frame.base64);
                        if (options.debug && !sent) {
                            log('FRAME', 'Error enviando frame');
                        }
                    }
                });
            }
        }, 1000); // Esperar 1 segundo antes de empezar a capturar
        return true;
    }, [
        isTranslating,
        connectRealtime,
        log,
        options.debug
    ]);
    // Detener traducción
    const stopRealtimeTranslation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!isTranslating) return;
        log('REALTIME', 'Deteniendo traducción');
        setIsTranslating(false);
        frameCaptureService.current?.stopContinuousCapture();
        wsService.current?.disconnect();
    }, [
        isTranslating,
        log
    ]);
    // Capturar frame único
    const captureFrame = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!videoRef.current || !frameCaptureService.current) {
            return null;
        }
        const frame = await frameCaptureService.current.captureFrame(videoRef.current);
        return frame ? new File([
            frame.blob
        ], 'frame.jpg', {
            type: 'image/jpeg'
        }) : null;
    }, []);
    // Limpiar recursos
    const cleanup = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        stopRealtimeTranslation();
        cameraService.current?.cleanup();
        setPermission('prompt');
        setCameraStatus('idle');
        setError('');
    }, [
        stopRealtimeTranslation
    ]);
    // Getters para compatibilidad
    const isSupported = cameraService.current?.isSupported() ?? false;
    const isInitializing = cameraStatus === 'initializing';
    const realtimeStatus = wsStatus;
    return {
        // Referencias
        videoRef,
        // Estados
        isSupported,
        permission,
        isInitializing,
        error,
        isTranslating,
        currentPrediction,
        confidence,
        lastTranslation,
        realtimeStatus,
        sessionId,
        // Métodos
        initialize,
        cleanup,
        captureFrame,
        startRealtimeTranslation,
        stopRealtimeTranslation,
        // Servicios (para uso avanzado)
        services: {
            camera: cameraService.current,
            websocket: wsService.current,
            frameCapture: frameCaptureService.current
        }
    };
};
}}),
"[project]/app/test-services/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Página de prueba para validar los nuevos servicios
 */ __turbopack_context__.s({
    "default": (()=>TestServicesPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$use$2d$advanced$2d$camera$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/use-advanced-camera.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function TestServicesPage() {
    const [testResults, setTestResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const camera = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$use$2d$advanced$2d$camera$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAdvancedCamera"])({
        debug: true,
        cameraConstraints: {
            width: 640,
            height: 480,
            facingMode: 'user'
        }
    });
    const addResult = (result)=>{
        setTestResults((prev)=>[
                ...prev,
                `${new Date().toLocaleTimeString()}: ${result}`
            ]);
    };
    const testCameraService = async ()=>{
        addResult('🎥 Probando CameraService...');
        const success = await camera.initialize();
        if (success) {
            addResult('✅ CameraService: Inicialización exitosa');
        } else {
            addResult('❌ CameraService: Error en inicialización');
        }
    };
    const testWebSocketService = async ()=>{
        addResult('🔌 Probando WebSocketService...');
        const success = await camera.startRealtimeTranslation();
        if (success) {
            addResult('✅ WebSocketService: Conexión exitosa');
            setTimeout(()=>{
                camera.stopRealtimeTranslation();
                addResult('🔌 WebSocketService: Desconectado');
            }, 5000);
        } else {
            addResult('❌ WebSocketService: Error de conexión');
        }
    };
    const testFrameCapture = async ()=>{
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
    const clearResults = ()=>{
        setTestResults([]);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-4xl mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-3xl font-bold text-gray-800 mb-8",
                    children: "🧪 Test de Nuevos Servicios"
                }, void 0, false, {
                    fileName: "[project]/app/test-services/page.tsx",
                    lineNumber: 71,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 lg:grid-cols-2 gap-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white rounded-xl shadow-lg p-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-xl font-semibold mb-4",
                                    children: "📹 Vista de Cámara"
                                }, void 0, false, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 78,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "aspect-video bg-gray-900 rounded-lg overflow-hidden",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                                        ref: camera.videoRef,
                                        className: "w-full h-full object-cover",
                                        autoPlay: true,
                                        playsInline: true,
                                        muted: true
                                    }, void 0, false, {
                                        fileName: "[project]/app/test-services/page.tsx",
                                        lineNumber: 80,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 79,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Estado Cámara:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/test-services/page.tsx",
                                                    lineNumber: 92,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `px-2 py-1 rounded text-sm ${camera.permission === 'granted' ? 'bg-green-100 text-green-800' : camera.permission === 'denied' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`,
                                                    children: camera.permission
                                                }, void 0, false, {
                                                    fileName: "[project]/app/test-services/page.tsx",
                                                    lineNumber: 93,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/test-services/page.tsx",
                                            lineNumber: 91,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "WebSocket:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/test-services/page.tsx",
                                                    lineNumber: 103,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `px-2 py-1 rounded text-sm ${camera.realtimeStatus === 'connected' ? 'bg-green-100 text-green-800' : camera.realtimeStatus === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`,
                                                    children: camera.realtimeStatus
                                                }, void 0, false, {
                                                    fileName: "[project]/app/test-services/page.tsx",
                                                    lineNumber: 104,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/test-services/page.tsx",
                                            lineNumber: 102,
                                            columnNumber: 15
                                        }, this),
                                        camera.isTranslating && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Predicción:"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/test-services/page.tsx",
                                                    lineNumber: 115,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-bold text-lg",
                                                    children: [
                                                        camera.currentPrediction || '...',
                                                        " (",
                                                        Math.round(camera.confidence * 100),
                                                        "%)"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/test-services/page.tsx",
                                                    lineNumber: 116,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/test-services/page.tsx",
                                            lineNumber: 114,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 90,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/test-services/page.tsx",
                            lineNumber: 77,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white rounded-xl shadow-lg p-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-xl font-semibold mb-4",
                                    children: "🎮 Controles de Prueba"
                                }, void 0, false, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 126,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: testCameraService,
                                            disabled: camera.isInitializing,
                                            className: "w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors",
                                            children: camera.isInitializing ? '⏳ Iniciando...' : '🎥 Probar CameraService'
                                        }, void 0, false, {
                                            fileName: "[project]/app/test-services/page.tsx",
                                            lineNumber: 129,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: testWebSocketService,
                                            disabled: camera.permission !== 'granted' || camera.isTranslating,
                                            className: "w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-medium transition-colors",
                                            children: camera.isTranslating ? '🔄 Traduciendo...' : '🔌 Probar WebSocket'
                                        }, void 0, false, {
                                            fileName: "[project]/app/test-services/page.tsx",
                                            lineNumber: 137,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: testFrameCapture,
                                            disabled: camera.permission !== 'granted',
                                            className: "w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg font-medium transition-colors",
                                            children: "📷 Probar Captura Frame"
                                        }, void 0, false, {
                                            fileName: "[project]/app/test-services/page.tsx",
                                            lineNumber: 145,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>camera.cleanup(),
                                            className: "w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors",
                                            children: "🧹 Limpiar Recursos"
                                        }, void 0, false, {
                                            fileName: "[project]/app/test-services/page.tsx",
                                            lineNumber: 153,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: clearResults,
                                            className: "w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors",
                                            children: "🗑️ Limpiar Resultados"
                                        }, void 0, false, {
                                            fileName: "[project]/app/test-services/page.tsx",
                                            lineNumber: 160,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 128,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-6 p-4 bg-gray-50 rounded-lg",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "font-semibold text-gray-700 mb-2",
                                            children: "📊 Info de Servicios"
                                        }, void 0, false, {
                                            fileName: "[project]/app/test-services/page.tsx",
                                            lineNumber: 170,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm text-gray-600 space-y-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        "Soporte: ",
                                                        camera.isSupported ? '✅' : '❌'
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/test-services/page.tsx",
                                                    lineNumber: 172,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        "Session ID: ",
                                                        camera.sessionId || 'N/A'
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/test-services/page.tsx",
                                                    lineNumber: 173,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        "Error: ",
                                                        camera.error || 'N/A'
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/test-services/page.tsx",
                                                    lineNumber: 174,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/test-services/page.tsx",
                                            lineNumber: 171,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 169,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/test-services/page.tsx",
                            lineNumber: 125,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/test-services/page.tsx",
                    lineNumber: 75,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-8 bg-white rounded-xl shadow-lg p-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-xl font-semibold mb-4",
                            children: "📝 Resultados de Pruebas"
                        }, void 0, false, {
                            fileName: "[project]/app/test-services/page.tsx",
                            lineNumber: 182,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm",
                            children: testResults.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-gray-500",
                                children: "No hay resultados aún... ¡Ejecuta algunas pruebas!"
                            }, void 0, false, {
                                fileName: "[project]/app/test-services/page.tsx",
                                lineNumber: 185,
                                columnNumber: 15
                            }, this) : testResults.map((result, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mb-1",
                                    children: result
                                }, index, false, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 188,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/app/test-services/page.tsx",
                            lineNumber: 183,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/test-services/page.tsx",
                    lineNumber: 181,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-8 bg-blue-50 border-l-4 border-blue-400 p-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "font-semibold text-blue-800 mb-2",
                            children: "📋 Instrucciones de Prueba"
                        }, void 0, false, {
                            fileName: "[project]/app/test-services/page.tsx",
                            lineNumber: 198,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                            className: "text-blue-700 text-sm space-y-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: '1. Haz clic en "Probar CameraService" para inicializar la cámara'
                                }, void 0, false, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 200,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: "2. Permite el acceso a la cámara cuando se solicite"
                                }, void 0, false, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 201,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: '3. Prueba "Probar WebSocket" para verificar la conexión'
                                }, void 0, false, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 202,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: '4. Usa "Probar Captura Frame" para verificar que los frames se capturan'
                                }, void 0, false, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 203,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: "5. Observa la consola del navegador para logs detallados"
                                }, void 0, false, {
                                    fileName: "[project]/app/test-services/page.tsx",
                                    lineNumber: 204,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/test-services/page.tsx",
                            lineNumber: 199,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/test-services/page.tsx",
                    lineNumber: 197,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/test-services/page.tsx",
            lineNumber: 70,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/test-services/page.tsx",
        lineNumber: 69,
        columnNumber: 5
    }, this);
}
}}),

};

//# sourceMappingURL=_3988620a._.js.map