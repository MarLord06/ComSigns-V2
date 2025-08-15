/**
 * GamificationService - Servicio para conectar con el backend de gamificación
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface GameLevel {
  id: number;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  unlocked: boolean;
  completed: boolean;
  stars: number;
  words_length: [number, number];
  time_limit: number;
  lives: number;
  points_multiplier: number;
  words: string[];
}

export interface Challenge {
  id: number;
  type: 'recognition' | 'formation' | 'speed' | 'sequence';
  letter?: string;
  letters?: string[];
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit_seconds?: number;
}

export interface GameSession {
  session_id: string;
  level_id: number;
  user_id?: string;
  started_at: string;
  status: 'active' | 'completed' | 'abandoned';
  current_word_index: number;
  score: number;
  lives_remaining: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  level: string;
}

export class GamificationService {
  private baseUrl: string;
  private getAuthHeaders: () => Promise<Record<string, string>>;

  constructor(getAuthHeaders?: () => Promise<Record<string, string>>) {
    this.baseUrl = `${API_BASE}/api/v1/gamification`;
    this.getAuthHeaders = getAuthHeaders || (() => Promise.resolve({}));
  }

  async getUserProfile(): Promise<{ current_level?: number; [key: string]: unknown }> {
    try {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.profile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // ========================================
  // 🎮 GAME LEVELS
  // ========================================
  
  async getGameLevels(): Promise<{ levels: GameLevel[]; total_levels: number }> {
    try {
      // Obtener letras reales del backend para construir palabras
      const letters = await this.getAllLetters();
      
      if (letters.length === 0) {
        throw new Error('No hay letras disponibles en el sistema');
      }

      // Obtener perfil del usuario para determinar niveles desbloqueados
      let userCurrentLevel = 1; // Por defecto nivel 1
      try {
        const userProfile = await this.getUserProfile();
        userCurrentLevel = userProfile.current_level || 1;
        console.log('[LEVELS] User current level:', userCurrentLevel);
      } catch (error) {
        console.warn('[LEVELS] Could not get user profile, defaulting to level 1:', error);
      }
      
      // Palabras organizadas por dificultad
      const wordsByDifficulty = {
        easy: [
          'SOL', 'MAR', 'PAN', 'CASA', 'MESA', 'AGUA', 'LUNA', 'GATO',
          'PERRO', 'AMOR', 'MAMÁ', 'PAPÁ', 'NIÑO', 'NIÑA'
        ],
        medium: [
          'ESCUELA', 'FAMILIA', 'HERMANO', 'COMIDA', 'TRABAJO', 'SALUD',
          'CIUDAD', 'AMIGO', 'TIEMPO', 'DINERO', 'VENTANA', 'PUERTA'
        ],
        hard: [
          'COMPUTADORA', 'UNIVERSIDAD', 'COMUNICACIÓN', 'DESARROLLO',
          'TECNOLOGÍA', 'OPORTUNIDAD', 'EXPERIENCIA', 'CONOCIMIENTO'
        ]
      };
      
      // Crear niveles dinámicos basados en palabras
      const dynamicLevels: GameLevel[] = [
        {
          id: 1,
          name: "Palabras Básicas",
          description: "Palabras simples de 3-5 letras",
          difficulty: 'easy',
          unlocked: userCurrentLevel >= 1,
          completed: userCurrentLevel > 1, // Completado si el usuario está en un nivel superior
          stars: 0,
          words_length: [3, 5],
          time_limit: 45, // Más tiempo para palabras
          lives: 5,
          points_multiplier: 1.0,
          words: wordsByDifficulty.easy.filter(word => 
            word.split('').every(letter => 
              letters.some(l => l.letter === letter)
            )
          ).slice(0, 8) // Solo las primeras 8 palabras
        },
        {
          id: 2,
          name: "Palabras Intermedias", 
          description: "Palabras de 6-8 letras",
          difficulty: 'medium',
          unlocked: userCurrentLevel >= 2,
          completed: userCurrentLevel > 2,
          stars: 0,
          words_length: [6, 8],
          time_limit: 60, // Más tiempo para palabras más largas
          lives: 4,
          points_multiplier: 1.5,
          words: wordsByDifficulty.medium.filter(word => 
            word.split('').every(letter => 
              letters.some(l => l.letter === letter)
            )
          ).slice(0, 6)
        },
        {
          id: 3,
          name: "Palabras Avanzadas",
          description: "Palabras largas y complejas",
          difficulty: 'hard',
          unlocked: userCurrentLevel >= 3,
          completed: userCurrentLevel > 3,
          stars: 0,
          words_length: [9, 15],
          time_limit: 90, // Mucho más tiempo para palabras largas
          lives: 3,
          points_multiplier: 2.0,
          words: wordsByDifficulty.hard.filter(word => 
            word.split('').every(letter => 
              letters.some(l => l.letter === letter)
            )
          ).slice(0, 4)
        }
      ];
      
      // Filtrar niveles que tengan al menos una palabra válida
      const validLevels = dynamicLevels.filter(level => level.words.length > 0);
      
      console.log('[LEVELS] Generated levels:', validLevels.map(l => ({ 
        id: l.id, 
        name: l.name, 
        unlocked: l.unlocked, 
        completed: l.completed 
      })));
      
      return {
        levels: validLevels,
        total_levels: validLevels.length
      };
    } catch (error) {
      console.error('Error fetching game levels:', error);
      
      // Fallback con palabras básicas si falla la conexión
      const fallbackLevels = [
        {
          id: 1,
          name: "Palabras Básicas",
          description: "Nivel de prueba con palabras simples",
          difficulty: "easy" as const,
          unlocked: true,
          completed: false,
          stars: 0,
          words_length: [3, 5] as [number, number],
          time_limit: 45,
          lives: 5,
          points_multiplier: 1.0,
          words: ["SOL", "MAR", "PAN", "CASA", "MESA"]
        }
      ];
      
      return {
        levels: fallbackLevels,
        total_levels: fallbackLevels.length
      };
    }
  }

  async startGameSession(levelId: number, userId?: string): Promise<GameSession> {
    try {
      console.log('[GAMIFICATION_SERVICE] Starting game session:', { levelId, userId });
      
      const authHeaders = await this.getAuthHeaders();
      console.log('[GAMIFICATION_SERVICE] Auth headers:', authHeaders);
      
      const response = await fetch(`${this.baseUrl}/game/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          session_type: "practice", // Usar el campo correcto según el backend
          user_id: userId // Enviar el UUID del usuario desde el contexto de auth
        })
      });
      
      console.log('[GAMIFICATION_SERVICE] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GAMIFICATION_SERVICE] Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[GAMIFICATION_SERVICE] Response data:', data);
      
      // Verificar que el backend devolvió una sesión válida
      if (!data.session) {
        console.error('Backend did not return a session object:', data);
        throw new Error('Backend did not return a valid session');
      }
      
      // El backend devuelve 'id' no 'session_id'
      const sessionId = data.session.id || data.session.session_id;
      if (!sessionId) {
        console.error('Backend session has no ID:', data.session);
        throw new Error('Backend did not return a valid session ID');
      }
      
      console.log('[GAMIFICATION_SERVICE] ✅ Session started successfully with ID:', sessionId);
      
      // Adaptar la respuesta del backend al formato esperado por el frontend
      return {
        session_id: sessionId, // Usar el ID real del backend (ya sea 'id' o 'session_id')
        level_id: levelId,
        user_id: userId,
        started_at: data.session.started_at || new Date().toISOString(),
        status: 'active' as const,
        current_word_index: 0,
        score: 0,
        lives_remaining: data.session.lives_remaining || 5
      };
    } catch (error) {
      console.error('Error starting game session:', error);
      throw error;
    }
  }

  async endGameSession(sessionId: string, finalScore: number, userId: string, completed: boolean = false) {
    try {
      console.log('[GAMIFICATION_SERVICE] Ending game session:', { sessionId, finalScore, userId, completed });
      const authHeaders = await this.getAuthHeaders();
      console.log('[GAMIFICATION_SERVICE] Auth headers for end:', authHeaders);
      const response = await fetch(`${this.baseUrl}/game/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          session_id: sessionId,
          final_score: finalScore,
          user_id: userId
        })
      });
      console.log('[GAMIFICATION_SERVICE] End response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GAMIFICATION_SERVICE] End response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('[GAMIFICATION_SERVICE] Game ended successfully:', result);
      return result;
    } catch (error) {
      console.error('[GAMIFICATION_SERVICE] Error ending game session:', error);
      throw error;
    }
  }

  // Registrar un intento de palabra completa (actualizado)
  async recordAttempt(attemptData: {
    session_id: string;
    user_id: string;
    target_letter: string;  // Para compatibilidad
    predicted_letter: string;  // Para compatibilidad
    is_correct: boolean;
    confidence: number;
    time_taken: number;
    word_index: number;
    target_word?: string;  // Palabra objetivo completa
    predicted_word?: string;  // Palabra predicha completa
  }): Promise<{ status: string; message: string }> {
    try {
      console.log('[GAMIFICATION_SERVICE] 📝 Enviando intento al backend:', {
        target_word: attemptData.target_word,
        predicted_word: attemptData.predicted_word,
        is_correct: attemptData.is_correct,
        user_id: attemptData.user_id
      });
      // Mapear los datos al formato esperado por el backend
      const response = await fetch(`${this.baseUrl}/game/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: attemptData.session_id,
          user_id: attemptData.user_id,
          letter_id: this.getLetterIdFromName(attemptData.target_letter), // Para compatibilidad
          is_correct: attemptData.is_correct,
          time_taken: attemptData.time_taken,
          confidence_score: attemptData.confidence,
          target_word: attemptData.target_word,  // Palabra completa
          predicted_word: attemptData.predicted_word  // Palabra predicha
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GAMIFICATION_SERVICE] Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error recording attempt:', error);
      throw error;
    }
  }

  // Método auxiliar para convertir letra a ID (temporal)
  private getLetterIdFromName(letter: string): number {
    const letterMap: { [key: string]: number } = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9, 'J': 10,
      'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15, 'P': 16, 'Q': 17, 'R': 18, 'S': 19,
      'T': 20, 'U': 21, 'V': 22, 'W': 23, 'X': 24, 'Y': 25, 'Z': 26
    };
    return letterMap[letter.toUpperCase()] || 1;
  }

  // ========================================
  // 🔤 LETTERS
  // ========================================
  
  async getAllLetters(): Promise<{ letter: string }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/letters`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.letters || [];
    } catch (error) {
      console.error('Error fetching letters:', error);
      return [];
    }
  }

  async getRandomLetters(count: number = 5): Promise<{ letter: string }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/letters/random/${count}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.letters || [];
    } catch (error) {
      console.error('Error fetching random letters:', error);
      return [];
    }
  }

  // ========================================
  // 🏆 CHALLENGES
  // ========================================
  
  async getChallenges(): Promise<Challenge[]> {
    try {
      const response = await fetch(`${this.baseUrl}/challenges`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.challenges || [];
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return [];
    }
  }

  async getChallengesByType(type: string): Promise<Challenge[]> {
    try {
      const response = await fetch(`${this.baseUrl}/challenges/type/${type}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.challenges || [];
    } catch (error) {
      console.error('Error fetching challenges by type:', error);
      return [];
    }
  }

  async getChallengesByDifficulty(difficulty: string): Promise<Challenge[]> {
    try {
      const response = await fetch(`${this.baseUrl}/challenges/difficulty/${difficulty}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.challenges || [];
    } catch (error) {
      console.error('Error fetching challenges by difficulty:', error);
      return [];
    }
  }

  async getRandomChallenge(): Promise<Challenge | null> {
    try {
      const response = await fetch(`${this.baseUrl}/challenges/random`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.challenge || null;
    } catch (error) {
      console.error('Error fetching random challenge:', error);
      return null;
    }
  }

  async completeChallenge(challengeId: number, score: number = 100) {
    try {
      const response = await fetch(`${this.baseUrl}/challenges/${challengeId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error completing challenge:', error);
      throw error;
    }
  }

  // ========================================
  // 📊 LEADERBOARD & STATS  
  // ========================================
  
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/leaderboard`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.leaderboard || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  async getStats() {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        total_challenges: 0,
        challenges_by_difficulty: {},
        challenges_by_type: {},
        max_points_available: 0
      };
    }
  }
}

// Instancia singleton sin autenticación (para casos donde no se requiera)
export const gamificationService = new GamificationService();

// Función para crear instancia con autenticación
export const createAuthenticatedGamificationService = (getAuthHeaders: () => Promise<Record<string, string>>) => {
  return new GamificationService(getAuthHeaders);
};
