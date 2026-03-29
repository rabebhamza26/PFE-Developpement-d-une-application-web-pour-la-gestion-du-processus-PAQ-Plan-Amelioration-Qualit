import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/sidebar.css";

function Sidebar() {
  const navigate = useNavigate();

  const goToEntretien = (pathPrefix) => {
    const matricule = window.prompt("Matricule du collaborateur ?");
    if (!matricule) return;
    navigate(`/${pathPrefix}/${matricule}`);
  };
  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-dot"></span>
        <h3>PAQ System</h3>
      </div>
      <ul className="sidebar-menu">
        <li><NavLink to="/dashboard">Dashboard</NavLink></li>
        <li><NavLink to="/collaborateurs">Collaborateurs</NavLink></li>
        <li><NavLink to="/paq-dossier">Dossier PAQ</NavLink></li>
        <li>
          <details className="sidebar-group" open>
            <summary>Entretien</summary>
            <ul className="sidebar-submenu">
              <li>
                <NavLink to="/entretien-positif">
                  <span className="step-index">0</span> Positif
                </NavLink>
              </li>
              <li>
                <button
                  type="button"
                  className="sidebar-link-btn"
                  onClick={() => goToEntretien("entretien-explicatif")}
                >
                  <span className="step-index">1</span> Explicatif
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="sidebar-link-btn"
                  onClick={() => goToEntretien("entretien-daccord")}
                >
                  <span className="step-index">2</span> D'accord
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="sidebar-link-btn"
                  onClick={() => goToEntretien("entretien-de-mesure")}
                >
                  <span className="step-index">3</span> De mesure
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="sidebar-link-btn"
                  onClick={() => goToEntretien("entretien-de-decision")}
                >
                  <span className="step-index">4</span> De decision
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="sidebar-link-btn"
                  onClick={() => goToEntretien("entretien-final")}
                >
                  <span className="step-index">5</span> Final
                </button>
              </li>
            </ul>
          </details>
        </li>

      </ul>
    </aside>
  );
}

export default Sidebar;
