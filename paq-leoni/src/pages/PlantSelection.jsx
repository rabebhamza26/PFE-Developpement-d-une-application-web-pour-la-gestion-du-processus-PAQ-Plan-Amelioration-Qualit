import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { plantService, siteService } from "../services/api";
import "../styles/plant-selection.css";


export default function PlantSelection() {
  const navigate = useNavigate();
  const { siteId } = useParams();

  const [plants, setPlants] = useState([]);
  const [siteName, setSiteName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Charger le nom du site
  useEffect(() => {
    siteService
      .getById(siteId)
      .then((res) => setSiteName(res.data?.name || "Site inconnu"))
      .catch(() => setSiteName("Site inconnu"));
  }, [siteId]);

  // Charger les plants FILTRÉS par siteId
  useEffect(() => {
    loadPlants();
  }, [siteId]);

  const loadPlants = async () => {
    try {
      setLoading(true);
      setError("");
      // On utilise le endpoint /plants/site/:siteId pour ne récupérer
      // que les plants appartenant à ce site
      const res = await plantService.getBySite(siteId);
      setPlants(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Impossible de charger les plants de ce site.");
      setPlants([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlantSelect = (plant) => {
    navigate("/login", {
      state: { siteName, plantName: plant.name, siteId, plantId: plant.id },
    });
  };

  return (
    <div className="ps-root">
      

      <div className="ps-content">
        
    <header className="ps-hero">
  <h1 className="ps-hero-title">PAQ Web System</h1>
  <p className="ps-hero-sub">Processus d'Amélioration Qualité</p>
</header>

{/* Breadcrumb amélioré */}
<div className="ps-breadcrumb">
  <span className="ps-bc-site">{siteName || "Chargement..."}</span>

  <svg viewBox="0 0 16 16" fill="none" className="ps-bc-icon">
    <path d="M5 3l5 5-5 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>

  <span className="ps-bc-current">Choisissez votre plant</span>
</div>

        {/* Section title */}
        <div className="ps-section-header">
          <div className="ps-section-line" />
          <div className="ps-section-line" />
        </div>

        {/* Error */}
        {error && <div className="ps-error">{error}</div>}

        {/* Grid */}
        <section className="ps-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="ps-card ps-skeleton" />
              ))
            : plants.length === 0
            ? (
                <div className="ps-empty">
                  <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" opacity=".3"/>
                    <path d="M24 16v8M24 30h.01" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round"/>
                  </svg>
                  <p>Aucun plant disponible pour ce site.</p>
                </div>
              )
            : plants.map((plant, i) => (
                <div
                  key={plant.id}
                  className="ps-card"
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => handlePlantSelect(plant)}
                >
                  <div className="ps-card-icon">
                    <svg viewBox="0 0 40 40" fill="none">
                      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" opacity=".9"/>
                      <rect x="22" y="6" width="12" height="12" rx="2" fill="currentColor" opacity=".6"/>
                      <rect x="6" y="22" width="12" height="12" rx="2" fill="currentColor" opacity=".6"/>
                      <rect x="22" y="22" width="12" height="12" rx="2" fill="currentColor" opacity=".9"/>
                    </svg>
                  </div>
                  <div className="ps-card-body">
                    <span className="ps-card-label">Plant</span>
                    <h3 className="ps-card-name">{plant.name}</h3>
                  </div>
                  <div className="ps-card-arrow">
                    <svg viewBox="0 0 20 20" fill="none">
                      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ))}
        </section>
      </div>
    </div>
  );
}
