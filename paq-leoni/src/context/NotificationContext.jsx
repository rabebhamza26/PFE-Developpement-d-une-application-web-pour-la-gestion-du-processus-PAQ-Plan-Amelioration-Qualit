// src/context/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { notificationService } from "../services/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth(); // Récupérer l'utilisateur et le token
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const stompClient = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const loadInitialNotifications = async () => {
    // ✅ Ne charger les notifications que si l'utilisateur est connecté
    if (!user || !token) {
      console.log("Utilisateur non connecté, chargement des notifications ignoré");
      return;
    }

    try {
      const res = await notificationService.getAll();
      console.log("Notifications chargées:", res.data);
      setNotifications(res.data || []);
      const unreadRes = await notificationService.countUnread();
      setUnreadCount(unreadRes.data?.count || 0);
    } catch (err) {
      console.error("Erreur chargement initial:", err);
      if (err.response?.status === 403) {
        console.warn("Non autorisé à lire les notifications");
      }
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const connectWebSocket = () => {
    // ✅ Ne connecter WebSocket que si l'utilisateur est connecté
    if (!user || !token) {
      console.log("Utilisateur non connecté, WebSocket non connecté");
      return;
    }

    const stompUrl = `${import.meta.env.VITE_API_URL || "http://localhost:8083"}/ws`;
    
    console.log("Connexion WebSocket à:", stompUrl);
    console.log("Token présent:", !!token);
    
    // Nettoyer l'ancienne connexion si elle existe
    if (stompClient.current && stompClient.current.active) {
      stompClient.current.deactivate();
    }
    
    const socket = new SockJS(stompUrl);
    
    stompClient.current = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        if (str.includes("ERROR")) {
          console.error("STOMP Error:", str);
        } else if (str.includes("CONNECTED")) {
          console.log("STOMP Connecté");
          reconnectAttempts.current = 0;
        }
      },
      onConnect: () => {
        console.log("WebSocket connecté avec succès");
        setConnected(true);
        reconnectAttempts.current = 0;
        
        stompClient.current.subscribe("/user/queue/notifications", (message) => {
          console.log("Nouvelle notification reçue:", message.body);
          try {
            const newNotification = JSON.parse(message.body);
            setNotifications(prev => [newNotification, ...prev]);
            if (!newNotification.lu) {
              setUnreadCount(prev => prev + 1);
            }
          } catch (err) {
            console.error("Erreur parsing notification:", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("Erreur STOMP:", frame);
        setConnected(false);
      },
      onDisconnect: () => {
        console.log("WebSocket déconnecté");
        setConnected(false);
      },
      onWebSocketError: (event) => {
        console.error("WebSocket error:", event);
        setConnected(false);
      }
    });
    
    stompClient.current.activate();
  };

  // ✅ Charger notifications quand l'utilisateur change (login)
  useEffect(() => {
    if (user && token) {
      loadInitialNotifications();
      connectWebSocket();
    } else {
      // Nettoyer les notifications quand l'utilisateur se déconnecte
      setNotifications([]);
      setUnreadCount(0);
      setConnected(false);
      if (stompClient.current) {
        try {
          stompClient.current.deactivate();
        } catch (err) {
          console.error("Erreur déconnexion WebSocket:", err);
        }
      }
    }
    
    return () => {
      if (stompClient.current) {
        try {
          stompClient.current.deactivate();
        } catch (err) {
          console.error("Erreur déconnexion WebSocket:", err);
        }
      }
    };
  }, [user, token]);

  const markAsRead = async (id) => {
    if (!user || !token) return;
    
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erreur marquage lu:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user || !token) return;
    
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Erreur marquage tout lu:", err);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.lu) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const refreshUnreadCount = async () => {
    if (!user || !token) return;
    
    try {
      const res = await notificationService.countUnread();
      setUnreadCount(res.data?.count || 0);
    } catch (err) {
      console.error("Erreur refresh compteur:", err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      connected,
      markAsRead,
      markAllAsRead,
      addNotification,
      refreshUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};