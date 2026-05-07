import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  

  // Vérifier si l'utilisateur a le rôle SL
  const isSL = user?.role === "SL";

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
      </div>
      <ul className="sidebar-menu">
        <li><NavLink to="/dashboard">Dashboard</NavLink></li>
        <li><NavLink to="/collaborateurs">Collaborateurs</NavLink></li>
        <li><NavLink to="/paq-dossier">Dossier PAQ</NavLink></li>
        
        {/* Entretien positif - visible uniquement pour les SL */}
        {isSL && (
            <li>
                <NavLink to="/entretien-positif">
                  Entretien Positif
                </NavLink>
              </li>
        )}

        {/* ✅ Notifications - visible pour tous les utilisateurs connectés */}
        <li>
          <NavLink to="/notifications">
            Notifications
          </NavLink>
        </li>
        
        <li><NavLink to="/archive">Archive</NavLink></li>
      </ul>
    </aside>
  );
}

export default Sidebar;