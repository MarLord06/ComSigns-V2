import { useState, useCallback, useEffect, useRef } from 'react';
import { translationService } from '@/lib/services/translation.service';

export function useBackendConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      setIsChecking(true);
      await translationService.healthCheck();
      setIsConnected(true);
      setLastCheck(new Date());
    } catch {
      setIsConnected(false);
    } finally { setIsChecking(false); }
  }, []);

  useEffect(() => {
    checkConnection();
    intervalRef.current = setInterval(checkConnection, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [checkConnection]);

  return { isConnected, isChecking, lastCheck, checkConnection };
}
