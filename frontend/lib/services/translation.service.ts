/**
 * Service layer para comunicación con el backend
 */

// Types para el API
export interface TranslationRequest {
  frame: File;
}

export interface TranslationResponse {
  success: boolean;
  method: string;
  result?: {
    text: string;
    confidence: number;
    processing_time_ms: number;
    signs_detected: number;
    detailed_predictions: Array<{
      sign: string;
      confidence: number;
      alternatives: string[];
    }>;
  };
  message?: string;
}

export interface APIError {
  error: string;
  details?: string;
  timestamp: string;
}

// Configuración del API
// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 10000; // 10 segundos

// Cliente HTTP personalizado
class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = DEFAULT_TIMEOUT;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
      },
    };

    // Timeout wrapper
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

// Translation Service
export class TranslationService {
  private client: APIClient;

  constructor() {
    this.client = new APIClient();
  }

  /**
   * Enviar frame para traducción al backend ML
   */
  async translateFrame(frame: File): Promise<TranslationResponse> {
    const formData = new FormData();
    formData.append('file', frame); // Cambiar 'frame' por 'file'

    try {
      // Endpoint del backend FastAPI
      const response = await this.client.postFormData<TranslationResponse>(
        '/api/v1/ml/predict/upload',
        formData
      );

      return response;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Translation failed'
      );
    }
  }

  /**
   * Health check del backend ML
   */
  async healthCheck(): Promise<{ status: string; components: unknown }> {
    try {
      return await this.client.get('/api/v1/ml/health');
    } catch {
      throw new Error('Health check failed');
    }
  }

  /**
   * Obtener información del modelo
   */
  async getModelInfo(): Promise<unknown> {
    try {
      return await this.client.get('/api/v1/ml/model/info');
    } catch {
      throw new Error('Failed to get model info');
    }
  }
}

// Singleton instance
export const translationService = new TranslationService();
