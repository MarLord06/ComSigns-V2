import { IncomingRealtimeMessage, OutgoingFrameMessage, OutgoingPingMessage, PredictionMessage, mapPredictionMessage, PredictionBase } from '@/lib/types/realtime';

export type RealtimeEvents = {
  open: () => void;
  close: (ev?: CloseEvent) => void;
  error: (err: any) => void;
  session: (sessionId: string) => void;
  prediction: (prediction: PredictionBase) => void;
  raw: (msg: IncomingRealtimeMessage) => void;
  reconnect: (attempt: number, delayMs: number) => void;
};

export type RealtimeStatus = 'idle' | 'connecting' | 'open' | 'closing' | 'reconnecting' | 'error';

interface RealtimeOptions {
  url?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  backoffInitialMs?: number;
  backoffFactor?: number;
  backoffMaxMs?: number;
  heartbeatIntervalMs?: number; // ping interval
  heartbeatTimeoutMs?: number;  // time to wait pong
  log?: boolean;
}

const DEFAULTS: Required<Omit<RealtimeOptions, 'url'>> = {
  autoReconnect: true,
  maxReconnectAttempts: 10,
  backoffInitialMs: 500,
  backoffFactor: 2,
  backoffMaxMs: 5000,
  heartbeatIntervalMs: 20000,
  heartbeatTimeoutMs: 5000,
  log: false,
};

export class RealtimePredictionWS {
  private ws: WebSocket | null = null;
  private opts: Required<Omit<RealtimeOptions, 'url'>>;
  private url: string;
  private status: RealtimeStatus = 'idle';
  private listeners: { [K in keyof RealtimeEvents]?: RealtimeEvents[K][] } = {};
  private reconnectAttempts = 0;
  private heartbeatTimer: any = null;
  private heartbeatTimeout: any = null;
  private sessionId: string | null = null;

  constructor(options: RealtimeOptions = {}) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsBase = options.url || (apiBase.startsWith('https') ? apiBase.replace('https', 'wss') : apiBase.replace('http', 'ws'));
    this.url = wsBase.replace(/\/$/, '') + '/api/v1/ml/predict';
    this.opts = { ...DEFAULTS, ...options };
    if (this.opts.log) console.log('[RealtimeWS] URL construida:', this.url);
  }

  getStatus() { return this.status; }
  getSessionId() { return this.sessionId; }

  on<K extends keyof RealtimeEvents>(event: K, cb: RealtimeEvents[K]) {
    const arr = (this.listeners[event] as RealtimeEvents[K][] | undefined) || [];
    arr.push(cb);
    this.listeners[event] = arr as any;
    return () => {
      const list = (this.listeners[event] as RealtimeEvents[K][] | undefined) || [];
      this.listeners[event] = list.filter(l => l !== cb) as any;
    };
  }

  private emit<K extends keyof RealtimeEvents>(event: K, ...args: Parameters<RealtimeEvents[K]>) {
    this.listeners[event]?.forEach(l => {
      try { (l as any)(...args); } catch (e) { if (this.opts.log) console.error('[Realtime] listener error', e); }
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

    this.ws.onopen = () => {
      if (this.opts.log) console.log('[RealtimeWS] Conexión abierta');
      this.status = 'open';
      this.emit('open');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (ev) => {
      if (this.opts.log) console.log('[RealtimeWS] Mensaje recibido:', ev.data);
      let parsed: IncomingRealtimeMessage;
      try { parsed = JSON.parse(ev.data); } catch { return; }
      this.emit('raw', parsed);
      switch (parsed.type) {
        case 'session':
          this.sessionId = (parsed as any).session_id;
          this.emit('session', this.sessionId!);
          break;
        case 'prediction': {
          const p = mapPredictionMessage(parsed as PredictionMessage);
          this.emit('prediction', p);
          break; }
        case 'pong':
          this.clearHeartbeatTimeout();
          break;
        case 'error':
          this.emit('error', (parsed as any).error);
          break;
        default:
          // ignore or expose via raw
          break;
      }
    };

    this.ws.onerror = (e) => {
      if (this.opts.log) console.error('[RealtimeWS] Error en WebSocket:', e);
      this.emit('error', e);
    };

    this.ws.onclose = (e) => {
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

  private scheduleReconnect() {
    this.reconnectAttempts += 1;
    const delay = Math.min(this.opts.backoffInitialMs * Math.pow(this.opts.backoffFactor, this.reconnectAttempts - 1), this.opts.backoffMaxMs);
    this.emit('reconnect', this.reconnectAttempts, delay);
    setTimeout(() => this.connect(), delay);
  }

  private startHeartbeat() {
    if (this.opts.heartbeatIntervalMs <= 0) return;
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.status === 'open') {
        this.sendPing();
        this.setHeartbeatTimeout();
      }
    }, this.opts.heartbeatIntervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
    this.clearHeartbeatTimeout();
  }

  private setHeartbeatTimeout() {
    this.clearHeartbeatTimeout();
    this.heartbeatTimeout = setTimeout(() => {
      if (this.opts.log) console.warn('[Realtime] Heartbeat timeout - forcing reconnect');
      this.forceReconnect();
    }, this.opts.heartbeatTimeoutMs);
  }

  private clearHeartbeatTimeout() {
    if (this.heartbeatTimeout) clearTimeout(this.heartbeatTimeout);
    this.heartbeatTimeout = null;
  }

  private forceReconnect() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }
  }

  sendFrame(base64Image: string) {
    if (!this.ws || this.status !== 'open') {
      if (this.opts.log) console.warn('[RealtimeWS] No se puede enviar frame, ws:', !!this.ws, 'status:', this.status);
      return;
    }
    const msg: OutgoingFrameMessage = { type: 'frame', image: base64Image, timestamp: Date.now() };
    if (this.opts.log) console.log('[RealtimeWS] Enviando frame, tamaño:', base64Image.length, 'chars');
    this.ws.send(JSON.stringify(msg));
  }

  sendPing() {
    if (!this.ws || this.status !== 'open') return;
    const msg: OutgoingPingMessage = { type: 'ping', timestamp: Date.now() };
    this.ws.send(JSON.stringify(msg));
  }

  close() {
    this.status = 'closing';
    this.stopHeartbeat();
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }
    this.ws = null;
    this.status = 'idle';
  }
}
