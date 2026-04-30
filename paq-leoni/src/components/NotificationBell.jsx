// src/components/NotificationBell.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext"; 
import "../styles/NotificationBell.css";

export default function NotificationBell() {
  const { notifications, nonLuesCount, marquerLue, marquerToutesLues } = useNotifications();
  const [ouvert, setOuvert] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  // Fermer si clic en dehors
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = async (notif) => {
    if (!notif.lu) await marquerLue(notif.id);
    setOuvert(false);
    if (notif.matricule) navigate(`/paq-dossier/${notif.matricule}`);
  };

  return (
    <div className="notif-bell-wrapper" ref={ref}>
      <button className="notif-bell-btn" onClick={() => setOuvert(o => !o)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {nonLuesCount > 0 && (
          <span className="notif-badge">{nonLuesCount > 99 ? "99+" : nonLuesCount}</span>
        )}
      </button>

      {ouvert && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifications</span>
            {nonLuesCount > 0 && (
              <button className="notif-tout-lire" onClick={marquerToutesLues}>
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">Aucune notification</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.lu ? "notif-item--unread" : ""}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="notif-item-titre">{n.titre}</div>
                  <div className="notif-item-message">{n.message}</div>
                  <div className="notif-item-date">
                    {new Date(n.createdAt).toLocaleString("fr-FR")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}