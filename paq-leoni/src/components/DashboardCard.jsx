import React from "react";

function DashboardCard({ title, value }) {
  return (
    <div style={styles.card}>
      <h4>{title}</h4>
      <h2>{value}</h2>
    </div>
  );
}

const styles = {
 
  card: {
    background: "#1a1a2e",
    color: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "160px",
    textAlign: "center",
    borderLeft: "4px solid #e8a020",
  },
  title: {
    fontSize: "11px",
    color: "#9aa3b2",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "8px",
  },
  value: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#e8a020",
    margin: 0,
  },

};

export default DashboardCard;