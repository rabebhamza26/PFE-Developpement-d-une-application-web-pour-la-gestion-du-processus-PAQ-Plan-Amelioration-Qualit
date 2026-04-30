// src/hooks/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export function useWebSocket({ url, topics = [], onMessage }) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const handleMessage = useCallback(
    (msg) => {
      try {
        const data = JSON.parse(msg.body);
        onMessage?.(data);
      } catch (e) {
        console.error("WebSocket parse error", e);
      }
    },
    [onMessage]
  );

  useEffect(() => {
    if (!url) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 5000,

      onConnect: () => {
        setConnected(true);

        topics.forEach((topic) => {
          client.subscribe(topic, handleMessage);
        });
      },

      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [url, topics, handleMessage]);

  return { connected };
}