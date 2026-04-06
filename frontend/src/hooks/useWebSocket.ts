"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { WSMessage } from "@/lib/types";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
const MAX_RETRIES = 5;

interface UseWebSocketReturn {
  isConnected: boolean;
  lastEvent: WSMessage | null;
  sendMessage: (msg: Record<string, unknown>) => void;
}

export function useWebSocket(sprintId: string | null): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!sprintId) return;

    const ws = new WebSocket(`${WS_BASE}/sprints/${sprintId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;
        setLastEvent(data);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;

      if (retriesRef.current < MAX_RETRIES) {
        const delay = Math.pow(2, retriesRef.current) * 1000;
        retriesRef.current += 1;
        retryTimeoutRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sprintId]);

  useEffect(() => {
    connect();
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { isConnected, lastEvent, sendMessage };
}
