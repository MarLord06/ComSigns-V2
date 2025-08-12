/**
 * Utilities para headers de autenticación
 */

import { supabase } from '@/lib/supabase';

export const getSupabaseAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session for auth headers:', error);
      return {};
    }
    
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
      };
    }
    
    return {};
  } catch (error) {
    console.error('Error creating auth headers:', error);
    return {};
  }
};
