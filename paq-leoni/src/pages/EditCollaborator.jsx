import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/collaborator.css";

const SEGMENT_OPTIONS = ["SEG-01", "SEG-02", "SEG-03", "SEG-04"];

function toInputDate(value) {
  if (!value) return "";
  const dateValue = String(value);
  if (dateValue.includes("T")) {
    return dateValue.slice(0, 10);
  }
  return dateValue;
}

function splitFullName(fullName) {
  const normalized = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!normalized) return { nom: "", prenom: "" };
  const parts = normalized.split(" ");
  return {
    nom: parts[0] || "",
    prenom: parts.slice(1).join(" "),
  };
}

function normalizeCollaborator(data, fallbackMatricule = "") {
  const parsed = splitFullName(data?.name ?? data?.nomPrenom ?? "");
  return {
    matricule: data?.matricule ?? fallbackMatricule,
    nom: parsed.nom,
    prenom: parsed.prenom,
    segment: data?.segment ?? "",
    hireDate: toInputDate(data?.hireDate ?? data?.dateEmbauche ?? ""),
  };
}

export default function EditCollaborator() {
  const { matricule } = useParams();
  const location = useLocation();
  const [formData, setFormData] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    segment: "",
    hireDate: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stateCollaborator = location.state?.collaborator;
    if (stateCollaborator) {
      setFormData(normalizeCollaborator(stateCollaborator, matricule));
      setLoading(false);
      loadCollaborator(true);
      return;
    }
    loadCollaborator(false);
  }, [matricule, location.state]);

  const loadCollaborator = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`http://localhost:8081/api/collaborators/${matricule}`);
      setFormData(normalizeCollaborator(res.data, matricule));
    } catch (err) {
      setError("Erreur lors du chargement du collaborateur");
      console.error("Erreur:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.nom || !formData.prenom || !formData.segment || !formData.hireDate) {
      setError("Tous les champs sont obligatoires");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        matricule: formData.matricule,
        name: `${formData.nom} ${formData.prenom}`.trim(),
        segment: formData.segment,
        hireDate: formData.hireDate,
      };
      await axios.put(`http://localhost:8081/api/collaborators/${matricule}`, payload);
      navigate("/collaborateurs");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la mise a jour");
      console.error("Erreur:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="form-container card shadow-sm border-0">
          <div className="card-body">
            <p className="text-center m-0">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="form-container card shadow-sm border-0">
        <div className="card-body p-4 p-md-5">
          <h2 className="mb-4">Modifier le Collaborateur</h2>

          {error && <div className="alert alert-danger py-2 error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label htmlFor="matricule" className="form-label">Matricule:</label>
              <input
                type="text"
                id="matricule"
                name="matricule"
                value={formData.matricule}
                className="form-control"
                disabled
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
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? "Mise a jour..." : "Mettre a jour"}
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
