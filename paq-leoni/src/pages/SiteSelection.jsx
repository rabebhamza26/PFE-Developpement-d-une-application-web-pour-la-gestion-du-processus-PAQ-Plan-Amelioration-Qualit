import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/selector.css";

const sites = [
  {
    id: "sousse-1",
    name: "Sousse 1",
    location: "Sousse, Tunisie",
    segments: ["Seg. A", "Seg. B", "Seg. C", "Seg. D"],
  },
  {
    id: "sousse-2",
    name: "Sousse 2",
    location: "Sousse, Tunisie",
    segments: ["Seg. E", "Seg. F"],
  },
  {
    id: "sidi-bouali",
    name: "Sidi Bouali",
    location: "Sidi Bouzid, Tunisie",
    segments: ["Seg. A", "Seg. B"],
  },
  {
    id: "menzel-hayet",
    name: "Menzel Hayet",
    location: "Monastir, Tunisie",
    segments: ["Seg. A", "Seg. C"],
  },
  {
    id: "mateur-nord",
    name: "Mateur  Nord",
    location: "Bizerte, Tunisie",
    segments: ["Seg. A", "Seg. B", "Seg. D"],
  },
  {
    id: "mateur-sud",
    name: "Mateur  Sud",
    location: "Bizerte, Tunisie",
    segments: ["Seg. B", "Seg. C"],
  },
];

export default function SiteSelection() {
  const navigate = useNavigate();

  return (
    <div className="selector-page">
      <div className="selector-container">
        <header className="selector-header">
          <div className="brand-mark">PAQ</div>
          <div>
            <h1>PAQ Web System</h1>
            <p>LEONI TUNISIE - PLAN D'AMELIORATION QUALITE</p>
          </div>
        </header>

        <h2 className="selector-title">Selectionnez votre site de production</h2>

        <section className="selector-grid">
          {sites.map((site) => (
            <button
              type="button"
              className="selector-card"
              key={site.id}
              onClick={() => navigate(`/plants/${site.id}`)}
            >
              <span className="factory-icon" aria-hidden="true">Factory</span>
              <h3>{site.name}</h3>
              <p>{site.location}</p>
              
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
