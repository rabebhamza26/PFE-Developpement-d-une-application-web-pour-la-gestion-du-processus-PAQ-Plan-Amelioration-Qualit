import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.left}>
        <h2 style={styles.title}>PAQ System</h2>
      
      </div>
      <button onClick={logout} style={styles.button}>Logout</button>
    </nav>
  );
}

const styles = {
  navbar: {
    height: "60px",
    background: "#1e293b",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  title: {
    margin: 0,
    fontSize: "1.25rem"
  },
  link: {
    color: "white",
    textDecoration: "none",
    padding: "6px 10px",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "6px"
  },
  button: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 12px",
    cursor: "pointer",
    borderRadius: "5px",
  },
};

export default Navbar;
