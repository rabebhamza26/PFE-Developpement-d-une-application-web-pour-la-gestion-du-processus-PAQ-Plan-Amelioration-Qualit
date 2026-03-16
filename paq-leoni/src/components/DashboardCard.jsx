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
    background: "#1e293b",
    color: "white",
    padding: "20px",
    borderRadius: "10px",
    width: "150px",
    textAlign: "center",
    boxShadow: "0px 2px 5px rgba(0,0,0,0.3)",
  },
};

export default DashboardCard;