import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/collaborator.css";

const SEGMENT_OPTIONS = ["SEG-01", "SEG-02", "SEG-03", "SEG-04"];

export default function AddCollaborator() {
  const [formData, setFormData] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    segment: "",
    hireDate: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "matricule") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 8);
      setFormData({
        ...formData,
        [name]: digitsOnly,
      });
      return;
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.matricule || !formData.nom || !formData.prenom || !formData.segment || !formData.hireDate) {
      setError("Tous les champs sont obligatoires");
      return;
    }

    if (!/^\d{8}$/.test(formData.matricule)) {
      const msg = "Le matricule doit contenir exactement 8 chiffres.";
      setError(msg);
      alert(msg);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        matricule: formData.matricule,
        name: `${formData.nom} ${formData.prenom}`.trim(),
        segment: formData.segment,
        hireDate: formData.hireDate,
      };
      await axios.post("http://localhost:8081/api/collaborators", payload);
      navigate("/collaborateurs");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout du collaborateur");
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="form-container card shadow-sm border-0">
        <div className="card-body p-4 p-md-5">
          <h2 className="mb-4">Ajouter un Collaborateur</h2>

          {error && <div className="alert alert-danger py-2 error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label htmlFor="matricule" className="form-label">Matricule:</label>
              <input
                type="text"
                id="matricule"
                name="matricule"
                value={formData.matricule}
                onChange={handleChange}
                inputMode="numeric"
                pattern="\d{8}"
                maxLength={8}
                title="Le matricule doit contenir exactement 8 chiffres."
                className="form-control"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="nom" className="form-label">Nom:</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="prenom" className="form-label">Prenom:</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="segment" className="form-label">Segment:</label>
              <select
                id="segment"
                name="segment"
                value={formData.segment}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Selectionner un segment</option>
                {SEGMENT_OPTIONS.map((segment) => (
                  <option key={segment} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-4">
              <label htmlFor="hireDate" className="form-label">Date d'embauche:</label>
              <input
                type="date"
                id="hireDate"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-buttons d-flex flex-column flex-sm-row gap-2">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "Enregistrement..." : "Ajouter"}
              </button>
              <button type="button" onClick={() => navigate("/collaborateurs")} className="btn btn-outline-secondary">
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
