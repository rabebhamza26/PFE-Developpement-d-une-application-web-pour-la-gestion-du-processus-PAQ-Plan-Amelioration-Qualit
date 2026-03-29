import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PaqDossierIndex() {
  const navigate = useNavigate();
  const [matricule, setMatricule] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = matricule.trim();
    if (!value) return;
    navigate(`/paq-dossier/${encodeURIComponent(value)}`);
  };

  return (
    <div className="container py-4">
      <h2>Acces au dossier PAQ</h2>
      <p>Rechercher un collaborateur par matricule pour ouvrir son dossier PAQ.</p>

      <form onSubmit={handleSubmit} className="paq-search row g-2 align-items-end">
        <div className="col-sm-6 col-md-4">
          <label htmlFor="matricule" className="form-label">Matricule</label>
          <input
            id="matricule"
            type="text"
            className="form-control"
            placeholder="Ex: 12345"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            required
          />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary">
            Ouvrir dossier
          </button>
        </div>
      </form>
    </div>
  );
}
