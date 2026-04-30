import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { notificationService } from "../services/api";
import { useAuth } from "../context/AuthContext"; 

export default function Notifications({ matricule: propMatricule }) {
  const { matricule: paramsMatricule } = useParams();
  const matricule = propMatricule || paramsMatricule;

  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);

  const stompClientRef = useRef(null);

  // 🔹 Charger les notifications depuis API
  const loadNotifications = async () => {
    if (!matricule) return;

    try {
      const res = await notificationService.getNotifications(matricule);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Erreur chargement notifications", err);
    }
  };

  // 🔹 Charger au montage + changement matricule
  useEffect(() => {
    loadNotifications();
  }, [matricule]);

  // 🔹 Log nouvelle notif
  useEffect(() => {
    if (notifications.length > 0) {
      console.log("📩 Nouvelle notif :", notifications[0].message);
    }
  }, [notifications]);

  // 🔹 Connexion WebSocket
  useEffect(() => {
    if (!matricule) return;

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8083/ws"),
      reconnectDelay: 5000,

      onConnect: () => {
        console.log("✅ WebSocket connecté");
        setConnected(true);

        // 🔥 Canal USER (recommandé avec Spring)
        client.subscribe("/user/queue/notifications", (msg) => {
          const notif = JSON.parse(msg.body);

          setNotifications((prev) => [notif, ...prev]);
        });
      },

      onDisconnect: () => {
        console.log("❌ WebSocket déconnecté");
        setConnected(false);
      },

      onStompError: (frame) => {
        console.error("Erreur STOMP", frame);
        setConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;

    // 🔻 Cleanup propre
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [matricule]);

  // 🔹 Marquer comme lu
  const handleRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error("Erreur markAsRead", err);
    }
  };

  return (
    <div className="notif-container">
      <h3>
        🔔 Notifications {connected ? "🟢" : "🔴"}
      </h3>

      {notifications.length === 0 ? (
        <p>Aucune notification</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className={`notif ${n.readStatus ? "read" : "unread"}`}
          >
            <p>{n.message}</p>

            {!n.readStatus && (
              <button onClick={() => handleRead(n.id)}>
                Marquer comme lu
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}