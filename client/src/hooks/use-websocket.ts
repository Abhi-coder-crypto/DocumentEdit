import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export interface WSMessage {
  type: string;
  data?: any;
  message?: string;
}

export function useWebSocket(onMessage?: (message: WSMessage) => void) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (!shouldReconnectRef.current) {
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      if (user) {
        ws.send(JSON.stringify({
          type: 'register',
          userId: user.id,
          role: user.role,
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        console.log('WebSocket message:', message);
        onMessage?.(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      if (shouldReconnectRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [user, onMessage]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    
    if (user) {
      connect();
    }

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, connect]);

  useEffect(() => {
    if (isConnected && user && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'register',
        userId: user.id,
        role: user.role,
      }));
    }
  }, [isConnected, user]);

  return {
    isConnected,
    ws: wsRef.current,
  };
}