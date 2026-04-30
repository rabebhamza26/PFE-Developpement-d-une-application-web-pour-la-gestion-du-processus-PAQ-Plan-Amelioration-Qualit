import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import "../../styles/admin-dashboard.css";

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const toggleMobileMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.warn("Logout backend echoue:", err?.message || err);
    } finally {
      logout();
      setIsOpen(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="admin-layout-wrapper">
      {/* Bouton Mobile (Hamburger) */}
      <button className="mobile-toggle" onClick={toggleMobileMenu}>
        <i className={isOpen ? "fas fa-times" : "fas fa-bars"}></i>
      </button>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <h5>LEONI <span>PAQ</span></h5>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <NavLink to="/admin" end onClick={() => setIsOpen(false)}>
                <i className="fas fa-tachometer-alt"></i>
                <span>Tableau de bord</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/users" onClick={() => setIsOpen(false)}>
                <i className="fas fa-users"></i>
                <span>Utilisateurs</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/segments" onClick={() => setIsOpen(false)}>
                <i className="fas fa-layer-group"></i>
                <span>Segments</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/sites" onClick={() => setIsOpen(false)}>
                <i className="fas fa-map-marker-alt"></i>
                <span>Sites</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/plants" onClick={() => setIsOpen(false)}>
                <i className="fas fa-industry"></i>
                <span>Plants</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Deconnexion</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}

      {/* Main content */}
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}
