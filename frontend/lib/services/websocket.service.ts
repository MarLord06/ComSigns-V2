/**
 * WebSocketService - Servicio genérico para conexiones WebSocket
 * Soporta reconexión automática, heartbeat y diferentes tipos de mensajes
 */

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export interface WebSocketOptions {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

export interface WebSocketCallbacks {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnect?: (attempt: number) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketOptions>;
  private callbacks: WebSocketCallbacks = {};
  private status: WebSocketStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(options: WebSocketOptions, callbacks: WebSocketCallbacks = {}) {
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
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
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
        
        this.ws.onopen = () => {
          if (this.options.debug) {
            console.log('[WebSocketService] Conexión establecida');
          }
          
          this.reconnectAttempts = 0;
          this.setStatus('connected');
          this.startHeartbeat();
          this.callbacks.onOpen?.();
          resolve();
        };

        this.ws.onclose = (event) => {
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

        this.ws.onerror = (error) => {
          if (this.options.debug) {
            console.error('[WebSocketService] Error de conexión:', error);
          }
          
          this.setStatus('error');
          this.callbacks.onError?.(error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            if (this.options.debug) {
              console.log('[WebSocketService] Mensaje recibido:', message);
            }
            
            // Manejar mensajes de heartbeat
            if (message.type === 'ping') {
              this.send({ type: 'pong' });
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
   */
  public disconnect(): void {
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
   */
  public send(message: WebSocketMessage): boolean {
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
   */
  public sendBinary(data: ArrayBuffer | Blob): boolean {
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
   */
  public sendFrame(base64Data: string, metadata: Record<string, unknown> = {}): boolean {
    return this.send({
      type: 'frame',
      data: base64Data,
      timestamp: Date.now(),
      ...metadata
    });
  }

  // Getters
  public getStatus(): WebSocketStatus { return this.status; }
  public isConnected(): boolean { return this.status === 'connected'; }
  public getReconnectAttempts(): number { return this.reconnectAttempts; }

  // Métodos para actualizar callbacks dinámicamente
  public updateCallbacks(newCallbacks: Partial<WebSocketCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks };
  }

  // Métodos privados
  private setStatus(newStatus: WebSocketStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.callbacks.onStatusChange?.(newStatus);
    }
  }

  private scheduleReconnect(): void {
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
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(() => {
        // El error ya se maneja en connect()
      });
    }, this.options.reconnectInterval);
  }

  private startHeartbeat(): void {
    if (this.options.heartbeatInterval <= 0) return;
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, this.options.heartbeatInterval);
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export default WebSocketService;
