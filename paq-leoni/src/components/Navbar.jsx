// src/components/Navbar.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import "../styles/navbar.css";

function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.warn("Logout backend échoué:", err.message);
    } finally {
      logout();
      window.location.href = "/";
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-title">
          <h2>PAQ System</h2>
          <span>Processus d'amélioration qualité</span>
        </div>
      </div>
      <div className="navbar-right">
        {user && (
          <>
            {/* ✅ Cloche de notifications */}
            <NotificationBell />

            <div className="navbar-user">
              <div className="navbar-avatar">
                {user.fullName?.[0] || user.login?.[0] || "U"}
              </div>
              <div className="navbar-user-meta">
                <span className="navbar-user-name">
                  {user.fullName || user.login || "Utilisateur"}
                </span>
                <span className="navbar-user-role">
                  {user.role || "ROLE"}
                </span>
              </div>
            </div>
          </>
        )}
        <button onClick={handleLogout} className="navbar-logout">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;