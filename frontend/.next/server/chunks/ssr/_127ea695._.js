module.exports = {

"[project]/lib/types/realtime.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// Tipos para protocolo WebSocket de predicción en tiempo real
__turbopack_context__.s({
    "CONFIDENCE_THRESHOLDS": (()=>CONFIDENCE_THRESHOLDS),
    "classifyConfidence": (()=>classifyConfidence),
    "mapPredictionMessage": (()=>mapPredictionMessage)
});
const CONFIDENCE_THRESHOLDS = {
    ACCEPT: 0.6,
    STRONG: 0.8,
    LOW: 0.4
};
function classifyConfidence(c) {
    if (c >= CONFIDENCE_THRESHOLDS.STRONG) return 'high';
    if (c >= CONFIDENCE_THRESHOLDS.ACCEPT) return 'medium';
    return 'low';
}
function mapPredictionMessage(msg) {
    return {
        letter: msg.letter || '',
        confidence: msg.confidence ?? 0,
        processingTimeMs: msg.processing_time_ms ?? 0,
        hasLandmarks: !!msg.landmarks_detected,
        raw: msg
    };
}
}}),
"[project]/lib/services/realtime.service.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "RealtimePredictionWS": (()=>RealtimePredictionWS)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$realtime$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/types/realtime.ts [app-ssr] (ecmascript)");
;
const DEFAULTS = {
    autoReconnect: true,
    maxReconnectAttempts: 10,
    backoffInitialMs: 500,
    backoffFactor: 2,
    backoffMaxMs: 5000,
    heartbeatIntervalMs: 20000,
    heartbeatTimeoutMs: 5000,
    log: false
};
class RealtimePredictionWS {
    ws = null;
    opts;
    url;
    status = 'idle';
    listeners = {};
    reconnectAttempts = 0;
    heartbeatTimer = null;
    heartbeatTimeout = null;
    sessionId = null;
    constructor(options = {}){
        const apiBase = ("TURBOPACK compile-time value", "localhost:8000") || ("TURBOPACK compile-time value", "localhost:8000") || 'http://localhost:8000';
        const wsBase = options.url || (apiBase.startsWith('https') ? apiBase.replace('https', 'wss') : apiBase.replace('http', 'ws'));
        this.url = wsBase.replace(/\/$/, '') + '/api/v1/ml/predict';
        this.opts = {
            ...DEFAULTS,
            ...options
        };
        if (this.opts.log) console.log('[RealtimeWS] URL construida:', this.url);
    }
    getStatus() {
        return this.status;
    }
    getSessionId() {
        return this.sessionId;
    }
    on(event, cb) {
        const arr = this.listeners[event] || [];
        arr.push(cb);
        this.listeners[event] = arr;
        return ()=>{
            const list = this.listeners[event] || [];
            this.listeners[event] = list.filter((l)=>l !== cb);
        };
    }
    emit(event, ...args) {
        this.listeners[event]?.forEach((l)=>{
            try {
                l(...args);
            } catch (e) {
                if (this.opts.log) console.error('[Realtime] listener error', e);
            }
        });
    }
    connect() {
        if (this.ws && (this.status === 'open' || this.status === 'connecting')) {
            if (this.opts.log) console.log('[RealtimeWS] Ya conectado/conectando, estado:', this.status);
            return;
        }
        this.status = this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting';
        if (this.opts.log) console.log('[RealtimeWS] Intentando conectar a:', this.url);
        try {
            this.ws = new WebSocket(this.url);
        } catch (e) {
            if (this.opts.log) console.error('[RealtimeWS] Error creando WebSocket:', e);
            this.status = 'error';
            this.emit('error', e);
            return;
        }
        this.ws.onopen = ()=>{
            if (this.opts.log) console.log('[RealtimeWS] Conexión abierta');
            this.status = 'open';
            this.emit('open');
            this.reconnectAttempts = 0;
            this.startHeartbeat();
        };
        this.ws.onmessage = (ev)=>{
            if (this.opts.log) console.log('[RealtimeWS] Mensaje recibido:', ev.data);
            let parsed;
            try {
                parsed = JSON.parse(ev.data);
            } catch  {
                return;
            }
            this.emit('raw', parsed);
            switch(parsed.type){
                case 'session':
                    this.sessionId = parsed.session_id;
                    this.emit('session', this.sessionId);
                    break;
                case 'prediction':
                    {
                        const p = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$realtime$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapPredictionMessage"])(parsed);
                        this.emit('prediction', p);
                        break;
                    }
                case 'pong':
                    this.clearHeartbeatTimeout();
                    break;
                case 'error':
                    this.emit('error', parsed.error);
                    break;
                default:
                    break;
            }
        };
        this.ws.onerror = (e)=>{
            if (this.opts.log) console.error('[RealtimeWS] Error en WebSocket:', e);
            this.emit('error', e);
        };
        this.ws.onclose = (e)=>{
            if (this.opts.log) console.log('[RealtimeWS] Conexión cerrada:', e.code, e.reason);
            this.stopHeartbeat();
            this.emit('close', e);
            if (this.status !== 'closing') {
                this.status = 'error';
                if (this.opts.autoReconnect && this.reconnectAttempts < this.opts.maxReconnectAttempts) {
                    this.scheduleReconnect();
                }
            }
        };
    }
    scheduleReconnect() {
        this.reconnectAttempts += 1;
        const delay = Math.min(this.opts.backoffInitialMs * Math.pow(this.opts.backoffFactor, this.reconnectAttempts - 1), this.opts.backoffMaxMs);
        this.emit('reconnect', this.reconnectAttempts, delay);
        setTimeout(()=>this.connect(), delay);
    }
    startHeartbeat() {
        if (this.opts.heartbeatIntervalMs <= 0) return;
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(()=>{
            if (this.ws && this.status === 'open') {
                this.sendPing();
                this.setHeartbeatTimeout();
            }
        }, this.opts.heartbeatIntervalMs);
    }
    stopHeartbeat() {
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
        this.clearHeartbeatTimeout();
    }
    setHeartbeatTimeout() {
        this.clearHeartbeatTimeout();
        this.heartbeatTimeout = setTimeout(()=>{
            if (this.opts.log) console.warn('[Realtime] Heartbeat timeout - forcing reconnect');
            this.forceReconnect();
        }, this.opts.heartbeatTimeoutMs);
    }
    clearHeartbeatTimeout() {
        if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
        this.heartbeatTimeout = null;
    }
    forceReconnect() {
        if (this.ws) {
            try {
                this.ws.close();
            } catch  {}
        }
    }
    sendFrame(base64Image) {
        if (!this.ws || this.status !== 'open') {
            if (this.opts.log) console.warn('[RealtimeWS] No se puede enviar frame, ws:', !!this.ws, 'status:', this.status);
            return;
        }
        const msg = {
            type: 'frame',
            image: base64Image,
            timestamp: Date.now()
        };
        if (this.opts.log) console.log('[RealtimeWS] Enviando frame, tamaño:', base64Image.length, 'chars');
        this.ws.send(JSON.stringify(msg));
    }
    sendPing() {
        if (!this.ws || this.status !== 'open') return;
        const msg = {
            type: 'ping',
            timestamp: Date.now()
        };
        this.ws.send(JSON.stringify(msg));
    }
    close() {
        this.status = 'closing';
        this.stopHeartbeat();
        if (this.ws) {
            try {
                this.ws.close();
            } catch  {}
        }
        this.ws = null;
        this.status = 'idle';
    }
}
}}),
"[project]/lib/hooks/use-realtime-prediction.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "useRealtimePrediction": (()=>useRealtimePrediction)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$realtime$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/services/realtime.service.ts [app-ssr] (ecmascript)");
;
;
function useRealtimePrediction(opts = {}) {
    const serviceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [lastPrediction, setLastPrediction] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [sessionId, setSessionId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [reconnectInfo, setReconnectInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Crear callback estable para manejar predicciones
    const handlePrediction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((p)=>{
        if (opts.log) console.log('[RT] prediction', p);
        setLastPrediction((prev)=>{
            // Solo actualizar si hay cambios significativos para evitar re-renders innecesarios
            if (!prev || prev.letter !== p.letter || Math.abs((prev.confidence || 0) - (p.confidence || 0)) > 0.01) {
                return p;
            }
            return prev;
        });
    }, [
        opts.log
    ]);
    if (!serviceRef.current) {
        serviceRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$realtime$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RealtimePredictionWS"]({
            log: opts.log
        });
    }
    const connect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        serviceRef.current?.connect();
    }, []);
    const disconnect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        serviceRef.current?.close();
        setStatus('idle');
    }, []);
    const sendFrame = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((base64)=>{
        serviceRef.current?.sendFrame(base64);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const svc = serviceRef.current;
        const offOpen = svc.on('open', ()=>{
            if (opts.log) console.log('[RT] open');
            setStatus('open');
            setError(null);
        });
        const offClose = svc.on('close', ()=>{
            if (opts.log) console.log('[RT] close');
            setStatus('idle');
        });
        const offErr = svc.on('error', (e)=>{
            if (opts.log) console.error('[RT] error', e);
            setError(typeof e === 'string' ? e : 'Realtime error');
            setStatus('error');
        });
        const offSess = svc.on('session', (id)=>{
            if (opts.log) console.log('[RT] session', id);
            setSessionId(id);
        });
        const offPred = svc.on('prediction', handlePrediction);
        const offReconnect = svc.on('reconnect', (attempt, delayMs)=>{
            if (opts.log) console.warn('[RT] reconnect', {
                attempt,
                delayMs
            });
            setStatus('reconnecting');
            setReconnectInfo({
                attempt,
                delayMs
            });
        });
        const offRaw = svc.on('raw', (msg)=>{
            if (opts.log) console.debug('[RT] raw', msg);
        });
        if (opts.autoConnect) connect();
        return ()=>{
            offOpen();
            offClose();
            offErr();
            offSess();
            offPred();
            offReconnect();
            offRaw();
        };
    }, [
        opts.autoConnect,
        handlePrediction,
        opts.log
    ]);
    return {
        status,
        lastPrediction,
        sessionId,
        error,
        reconnectInfo,
        connect,
        disconnect,
        sendFrame
    };
}
}}),
"[project]/lib/hooks/use-advanced-camera-v2.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * useAdvancedCamera - Hook mejorado basado en el hook actual que funciona
 * Mantiene la funcionalidad existente pero con mejor modularización
 */ __turbopack_context__.s({
    "useAdvancedCamera": (()=>useAdvancedCamera)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$use$2d$realtime$2d$prediction$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/use-realtime-prediction.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$realtime$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/types/realtime.ts [app-ssr] (ecmascript)");
;
;
;
function useAdvancedCamera(options = {}) {
    // Configuración con defaults
    const config = {
        debug: false,
        autoConnect: false,
        confidenceThreshold: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$types$2f$realtime$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CONFIDENCE_THRESHOLDS"].ACCEPT,
        frameInterval: 200,
        cameraConstraints: {
            width: 640,
            height: 480,
            facingMode: 'user'
        },
        ...options
    };
    // Estados base (igual que el hook original)
    const [isSupported, setIsSupported] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [permission, setPermission] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('prompt');
    const [isInitializing, setIsInitializing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [isTranslating, setIsTranslating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [currentPrediction, setCurrentPrediction] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [confidence, setConfidence] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [lastTranslation, setLastTranslation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Referencias (igual que el hook original)
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const streamRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const intervalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Nuevos estados para estadísticas
    const [stats, setStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        totalFramesSent: 0,
        successfulPredictions: 0,
        averageConfidence: 0,
        sessionDuration: 0,
        droppedFrames: 0
    });
    const sessionStartTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(Date.now());
    // Hook de predicción en tiempo real (igual que el original)
    const { status: realtimeStatus, lastPrediction: realtimePrediction, error: realtimeError, connect: connectRealtime, disconnect: disconnectRealtime, sendFrame } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$use$2d$realtime$2d$prediction$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRealtimePrediction"])({
        autoConnect: config.autoConnect,
        log: config.debug
    });
    // Debug logging
    const log = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((prefix, ...args)=>{
        if (config.debug) {
            console.log(`[ADV_CAM_${prefix}]`, ...args);
        }
    }, [
        config.debug
    ]);
    // Efectos del hook original
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (realtimeError) setError(realtimeError);
    }, [
        realtimeError
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!realtimePrediction) return;
        log('PREDICTION', realtimePrediction);
        const letter = realtimePrediction.letter || '';
        const conf = realtimePrediction.confidence || 0;
        // Actualizar estadísticas
        setStats((prev)=>({
                ...prev,
                totalFramesSent: prev.totalFramesSent + 1,
                successfulPredictions: conf >= config.confidenceThreshold ? prev.successfulPredictions + 1 : prev.successfulPredictions,
                averageConfidence: (prev.averageConfidence * prev.totalFramesSent + conf) / (prev.totalFramesSent + 1),
                sessionDuration: Date.now() - sessionStartTime.current
            }));
        if (conf >= config.confidenceThreshold && letter) {
            setCurrentPrediction(letter);
        } else if (!letter) {
            setCurrentPrediction('?');
        }
        setConfidence(conf);
        setLastTranslation({
            success: true,
            method: 'websocket_prediction',
            result: {
                text: letter || '?',
                confidence: conf,
                processing_time_ms: realtimePrediction.processingTimeMs || 0,
                signs_detected: realtimePrediction.hasLandmarks ? 1 : 0,
                detailed_predictions: []
            }
        });
    }, [
        realtimePrediction,
        config.confidenceThreshold,
        log
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setIsSupported(typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices);
    }, []);
    // Función de inicialización mejorada
    const initialize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!isSupported) {
            setError('Camera not supported in this browser');
            return false;
        }
        setIsInitializing(true);
        setError('');
        try {
            log('INIT', 'Solicitando permisos de cámara...');
            const constraints = {
                video: {
                    width: {
                        ideal: config.cameraConstraints.width
                    },
                    height: {
                        ideal: config.cameraConstraints.height
                    },
                    facingMode: config.cameraConstraints.facingMode
                },
                audio: false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.autoplay = true;
                videoRef.current.playsInline = true;
                videoRef.current.muted = true;
                // Esperar a que el video esté listo
                await new Promise((resolve, reject)=>{
                    const video = videoRef.current;
                    const onLoadedMetadata = ()=>{
                        video.removeEventListener('loadedmetadata', onLoadedMetadata);
                        video.removeEventListener('error', onError);
                        resolve();
                    };
                    const onError = (e)=>{
                        video.removeEventListener('loadedmetadata', onLoadedMetadata);
                        video.removeEventListener('error', onError);
                        reject(new Error('Video load error'));
                    };
                    video.addEventListener('loadedmetadata', onLoadedMetadata);
                    video.addEventListener('error', onError);
                    // Si ya está cargado
                    if (video.readyState >= 1) {
                        onLoadedMetadata();
                    }
                });
                // Forzar reproducción
                await videoRef.current.play();
            }
            setPermission('granted');
            log('INIT', 'Cámara inicializada correctamente');
            return true;
        } catch (error) {
            setPermission('denied');
            const errorMsg = error.name === 'NotAllowedError' ? 'Camera permission denied' : `Camera initialization failed: ${error.message}`;
            setError(errorMsg);
            log('INIT_ERROR', errorMsg, error);
            return false;
        } finally{
            setIsInitializing(false);
        }
    }, [
        isSupported,
        config.cameraConstraints,
        log
    ]);
    // Función de captura de frame mejorada
    const captureAndSendFrame = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((cameraViewRef, forceTranslating = false)=>{
        const shouldTranslate = forceTranslating || isTranslating;
        if (!shouldTranslate) {
            log('FRAME', 'No traduciendo, saltando frame');
            return;
        }
        if (!cameraViewRef?.current) {
            log('FRAME', 'Sin cameraViewRef, usando videoRef directo');
            // Fallback: usar videoRef directo
            if (!videoRef.current || videoRef.current.readyState < 2) {
                setStats((prev)=>({
                        ...prev,
                        droppedFrames: prev.droppedFrames + 1
                    }));
                return;
            }
            try {
                if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
                const canvas = canvasRef.current;
                const video = videoRef.current;
                canvas.width = video.videoWidth || config.cameraConstraints.width || 640;
                canvas.height = video.videoHeight || config.cameraConstraints.height || 480;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                const base64 = dataUrl.split(',')[1];
                if (base64) {
                    sendFrame(base64);
                    log('FRAME', `Frame enviado desde videoRef (${base64.length} chars)`);
                }
            } catch (e) {
                log('FRAME_ERROR', 'Error capturando desde videoRef:', e);
                setStats((prev)=>({
                        ...prev,
                        droppedFrames: prev.droppedFrames + 1
                    }));
            }
            return;
        }
        // Usar cameraViewRef (comportamiento original)
        try {
            const videoElement = cameraViewRef.current.getVideoElement?.() || videoRef.current;
            if (!videoElement || videoElement.readyState < 2) {
                setStats((prev)=>({
                        ...prev,
                        droppedFrames: prev.droppedFrames + 1
                    }));
                return;
            }
            if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
            const canvas = canvasRef.current;
            canvas.width = videoElement.videoWidth || config.cameraConstraints.width || 640;
            canvas.height = videoElement.videoHeight || config.cameraConstraints.height || 480;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64 = dataUrl.split(',')[1];
            if (base64) {
                sendFrame(base64);
                log('FRAME', `Frame enviado desde cameraViewRef (${base64.length} chars)`);
            }
        } catch (e) {
            log('FRAME_ERROR', 'Error capturando frame:', e);
            setStats((prev)=>({
                    ...prev,
                    droppedFrames: prev.droppedFrames + 1
                }));
        }
    }, [
        isTranslating,
        sendFrame,
        config.cameraConstraints,
        log
    ]);
    // Funciones de traducción (igual que el original pero con mejoras)
    const startRealtimeTranslation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((cameraViewRef)=>{
        if (isTranslating) return;
        log('RT_START', 'Iniciando traducción en tiempo real');
        sessionStartTime.current = Date.now();
        connectRealtime();
        setIsTranslating(true);
        setCurrentPrediction('');
        setConfidence(0);
        intervalRef.current = setInterval(()=>{
            captureAndSendFrame(cameraViewRef, true);
        }, config.frameInterval);
        log('RT_START', `Interval iniciado con ID: ${intervalRef.current}`);
    }, [
        isTranslating,
        connectRealtime,
        captureAndSendFrame,
        config.frameInterval,
        log
    ]);
    const stopRealtimeTranslation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!isTranslating) return;
        log('RT_STOP', 'Deteniendo traducción');
        setIsTranslating(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        disconnectRealtime();
    }, [
        isTranslating,
        disconnectRealtime,
        log
    ]);
    // Función de limpieza mejorada
    const cleanup = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        log('CLEANUP', 'Limpiando recursos');
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track)=>track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        stopRealtimeTranslation();
        setPermission('prompt');
        setError('');
        // Resetear estadísticas
        setStats({
            totalFramesSent: 0,
            successfulPredictions: 0,
            averageConfidence: 0,
            sessionDuration: 0,
            droppedFrames: 0
        });
    }, [
        stopRealtimeTranslation,
        log
    ]);
    // Función de captura de frame individual
    const captureFrame = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        return new Promise((resolve)=>{
            if (!videoRef.current || videoRef.current.readyState < 2) {
                resolve(null);
                return;
            }
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
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
            }, 'image/jpeg', 0.8);
        });
    }, []);
    // Nuevas funciones
    const getStats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        return {
            ...stats,
            sessionDuration: Date.now() - sessionStartTime.current
        };
    }, [
        stats
    ]);
    const updateOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((newOptions)=>{
        Object.assign(config, newOptions);
        log('CONFIG', 'Opciones actualizadas:', newOptions);
    }, [
        config,
        log
    ]);
    // Cleanup en unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        return ()=>{
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
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
        // Métodos originales
        initialize,
        cleanup,
        captureFrame,
        startRealtimeTranslation,
        stopRealtimeTranslation,
        // Nuevos métodos
        getStats,
        updateOptions
    };
}
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
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$use$2d$advanced$2d$camera$2d$v2$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/hooks/use-advanced-camera-v2.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function TestServicesPage() {
    const [testResults, setTestResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const camera = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$hooks$2f$use$2d$advanced$2d$camera$2d$v2$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAdvancedCamera"])({
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
    const testWebSocketService = ()=>{
        addResult('🔌 Probando WebSocketService...');
        try {
            camera.startRealtimeTranslation();
            addResult('✅ WebSocketService: Iniciando conexión...');
            setTimeout(()=>{
                camera.stopRealtimeTranslation();
                addResult('🔌 WebSocketService: Desconectado');
            }, 5000);
        } catch (error) {
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
                                                        (camera.confidence * 100).toFixed(2),
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
                                                        "Stats: ",
                                                        JSON.stringify(camera.getStats())
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

//# sourceMappingURL=_127ea695._.js.map