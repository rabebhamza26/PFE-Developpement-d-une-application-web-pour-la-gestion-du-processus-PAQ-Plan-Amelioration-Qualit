import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/selector.css";

const plantsBySite = {
  "sousse-1": ["Volkswagen", "Mercedes-Benz", "BMW", "Audi", "Porsche", "Peugeot", "Citroën" ," Fiat"],
  "sousse-2": ["Volkswagen", "Mercedes-Benz", "BMW", "Audi", "Porsche", "Peugeot", "Citroën" ," Fiat"],
  "sidi-bouali": ["Volkswagen", "Mercedes-Benz", "BMW", "Audi", "Porsche", "Peugeot", "Citroën" ," Fiat"],
  "menzel-hayet": ["Volkswagen", "Mercedes-Benz", "BMW", "Audi", "Porsche", "Peugeot", "Citroën" ," Fiat"],
  "mateur-nord": ["Volkswagen", "Mercedes-Benz", "BMW", "Audi", "Porsche", "Peugeot", "Citroën" ," Fiat"],
  "mateur-sud": ["Volkswagen", "Mercedes-Benz", "BMW", "Audi", "Porsche", "Peugeot", "Citroën" ," Fiat"],
};

const siteNames = {
  "sousse-1": "Sousse 1",
  "sousse-2": "Sousse 2",
  "sidi-bouali": "Sidi Bouali",
  "menzel-hayet": "Menzel Hayet",
  "mateur-nord": "Mateur Nord",
  "mateur-sud": "Mateur Sud",
};

export default function PlantSelection() {
  const navigate = useNavigate();
  const { siteId } = useParams();

  const siteName = siteNames[siteId] || "Site";
  const plants = plantsBySite[siteId] || ["Plant A", "Plant B"];

  return (
    <div className="selector-page">
      <div className="selector-container">
        <header className="selector-header">
          <div className="brand-mark">PAQ</div>
          <div>
            <h1>PAQ System</h1>
            <p>LEONI TUNISIE - PLAN D'AMELIORATION QUALITE</p>
          </div>
        </header>

        <h2 className="selector-title">{siteName} - Selectionnez votre plant</h2>

        <section className="selector-grid">
          {plants.map((plant) => (
            <button
              type="button"
              className="selector-card"
              key={plant}
              onClick={() =>
                navigate("/login", {
                  state: { siteName, plantName: plant },
                })
              }
            >
              <span className="factory-icon" aria-hidden="true">Factory</span>
              <h3>{plant}</h3>
              <p>{siteName}, Tunisie</p>
              
            </button>
          ))}
        </section>

        <button
          type="button"
          className="back-link"
          onClick={() => navigate("/")}
        >
          Retour aux sites
        </button>
      </div>
    </div>
  );
}
