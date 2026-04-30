// src/context/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { notificationService } from "../services/api";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [nonLuesCount, setNonLuesCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getAll();
      const data = res.data || [];
      setNotifications(data);
      setNonLuesCount(data.filter(n => !n.lu).length);
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Polling toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const marquerLue = async (id) => {
    try {
      await notificationService.marquerLue(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      );
      setNonLuesCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Erreur marquer lue:", err);
    }
  };

  const marquerToutesLues = async () => {
    try {
      await notificationService.marquerToutesLues();
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setNonLuesCount(0);
    } catch (err) {
      console.error("Erreur marquer toutes lues:", err);
    }
  };

  const envoyerEmail = async (data) => {
    try {
      await notificationService.envoyerEmail(data);
    } catch (err) {
      console.error("Erreur envoi email:", err);
      throw err;
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      nonLuesCount,
      fetchNotifications,
      marquerLue,
      marquerToutesLues,
      envoyerEmail,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications doit être utilisé dans NotificationProvider");
  return ctx;
}