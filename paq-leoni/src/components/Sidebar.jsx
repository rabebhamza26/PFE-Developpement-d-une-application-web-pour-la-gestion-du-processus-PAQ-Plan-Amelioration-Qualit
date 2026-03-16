import React from "react";
import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div style={styles.sidebar}>
      <h3>PAQ System</h3>
      <ul style={styles.menu}>
        <li><Link to="/dashboard" style={styles.link}>Dashboard</Link></li>
        <li><Link to="/collaborateurs" style={styles.link}>Collaborateurs</Link></li>
        <li><Link to="/paq-dossier" style={styles.link}>Dossier PAQ</Link></li>
        <li><Link to="/admin" style={styles.link}>Admin</Link></li>
        <li><Link to="/create-entretien" style={styles.link}>Niveau 1 — Explication</Link></li>

      </ul>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "220px",
    height: "100vh",
    background: "#0f172a",
    color: "white",
    padding: "20px",
    boxSizing: "border-box",
  },
  menu: {
    listStyle: "none",
    padding: 0,
    marginTop: "20px",
  },
  link: {
    display: "block",
    padding: "10px 0",
    color: "white",
    textDecoration: "none",
  },
};

export default Sidebar;
