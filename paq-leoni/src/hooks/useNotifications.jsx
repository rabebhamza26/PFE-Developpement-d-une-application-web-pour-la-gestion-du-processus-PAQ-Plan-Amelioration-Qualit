// src/hooks/useNotifications.js
import { useState, useCallback } from "react";
import { notificationService } from "../services/api";
import { useWebSocket } from "./useWebSocket";

export function useNotifications(matricule) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });

    // browser notification
    if (Notification.permission === "granted") {
      new Notification(`PAQ`, { body: notif.message });
    }
  }, []);

  const { connected } = useWebSocket({
    url: "http://localhost:8083/ws",
    topics: [
      `/topic/notifications/${matricule}`,
      "/topic/paq-events",
    ],
    onMessage: (notif) => {
      if (!notif.matricule || notif.matricule === matricule) {
        addNotification(notif);
      }
    },
  });

  const loadNotifications = useCallback(async () => {
    const res = await notificationService.getAll(matricule);
    setNotifications(res.data || []);
  }, [matricule]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readStatus: true } : n
      )
    );

    await notificationService.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readStatus: true }))
    );

    await notificationService.markAllAsRead(matricule);
  }, [matricule]);

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  return {
    connected,
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}