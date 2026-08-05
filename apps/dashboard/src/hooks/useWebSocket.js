import { useState, useEffect, useRef } from 'react';

/**
 * Custom React hook for live WebSocket activity feed updates.
 * Handles automatic reconnects and returns live event stream.
 */
export function useWebSocket(url = 'ws://localhost:8000/ws/live') {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let reconnectTimer = null;

    function connect() {
      // Determine protocol (ws vs wss) based on page
      const wsUrl = url.startsWith('ws')
        ? url
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/live`;

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log('[WS] Connected to live feed server.');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages((prev) => [data, ...prev.slice(0, 49)]); // Keep last 50 live events
        } catch (e) {
          // Ignore non-JSON messages
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log('[WS] Disconnected. Reconnecting in 3 seconds...');
        reconnectTimer = setTimeout(connect, 3000);
      };

      socket.onerror = (error) => {
        console.error('[WS ERROR]', error);
        socket.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socketRef.current) socketRef.current.close();
    };
  }, [url]);

  return { messages, isConnected };
}
