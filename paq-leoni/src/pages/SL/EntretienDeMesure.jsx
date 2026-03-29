import React, { useState, useEffect, useRef } from "react";
import { collaboratorService, paqService } from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/paq-dossier.css";

const DEFAULT_TYPES = ["Collage inverse", "Erreur montage", "Defaut qualite"];

export default function EntretienDeMesure({ niveau = 3 }) {
  const { matricule } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [collaborator, setCollaborator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureBase64, setSignatureBase64] = useState("");
  const [showDefautModal, setShowDefautModal] = useState(false);
  const [defautTypeInput, setDefautTypeInput] = useState("");
  const [typeOptions, setTypeOptions] = useState(DEFAULT_TYPES);

  const [formData, setFormData] = useState({
    typeFaute: "",
    gravite: "Faible",
    dateFaute: new Date().toISOString().split("T")[0],
    description: "",
    mesuresCorrectives: "",
    commentaire: ""
  });

  const entretienConfig = {
    1: { title: "Entretien explicatif", api: paqService.createPremierEntretien },
    2: { title: "Entretien d'accord", api: paqService.createDeuxiemeEntretien },
    3: { title: "Entretien de mesure", api: paqService.createTroisiemeEntretien },
    4: { title: "Quatrieme Entretien", api: paqService.createQuatriemeEntretien },
    5: { title: "Cinquieme Entretien", api: paqService.createCinquiemeEntretien },
  };
  const currentEntretien = entretienConfig[niveau] || entretienConfig[1];

  useEffect(() => {
    loadCollaborator();
  }, [matricule]);

  const loadCollaborator = async () => {
    try {
      setLoading(true);
      const res = await collaboratorService.getById(matricule);
      setCollaborator(res.data);
    } catch (err) {
      console.error("Erreur lors du chargement du collaborateur:", err);
      setError("Impossible de charger les informations du collaborateur");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const addTypeOption = () => {
    const value = defautTypeInput.trim();
    if (!value) return;
    if (!typeOptions.includes(value)) {
      setTypeOptions((prev) => [...prev, value]);
    }
    setFormData((prev) => ({
      ...prev,
      typeFaute: value
    }));
    setDefautTypeInput("");
    setShowDefautModal(false);
  };

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPoint(event);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#e5efff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSignatureBase64(dataUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!signatureBase64) {
      setError("Signature electronique requise");
      return;
    }

    setSaving(true);

    try {
      const entretienData = {
        notes: formData.commentaire || "",
        date: formData.dateFaute,
        signatureBase64,
        typeFaute: formData.typeFaute,
        gravite: formData.gravite,
        description: formData.description,
        mesuresCorrectives: formData.mesuresCorrectives,
      };

      await currentEntretien.api(matricule, entretienData);

      navigate(`/paq-dossier/${matricule}`);
    } catch (err) {
      console.error("Erreur lors de la creation de l'entretien:", err);
      setError("Erreur lors de la creation de l'entretien");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="paq-loading">Chargement...</div>;
  }

  if (error && !collaborator) {
    return (
      <div className="paq-shell">
        <button onClick={() => navigate(`/paq-dossier/${matricule}`)}>Retour</button>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="paq-shell">
      <div className="paq-header">
        <h1>{currentEntretien.title} - {collaborator?.name}</h1>
        <div className="paq-actions">
          <button onClick={() => navigate(`/paq-dossier/${matricule}`)} className="btn btn-secondary">
            Retour au dossier
          </button>
        </div>
      </div>

      <div className="paq-meta">
        <p><b>Matricule :</b> {collaborator?.matricule}</p>
        <p><b>Nom :</b> {collaborator?.name}</p>
        <p><b>Segment :</b> {collaborator?.segment}</p>
        <p><b>Date d'embauche :</b> {collaborator?.hireDate}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="entretien-form">
        <div className="form-section">
          <h3>Informations generales</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Type de faute</label>
              <div className="type-defaut-row">
                <select className="form-select" name="typeFaute" value={formData.typeFaute} onChange={handleChange} required>
                  <option value="">Choisir</option>
                  {typeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-add-defaut"
                  onClick={() => setShowDefautModal(true)}
                >
                  Ajouter un defaut
                </button>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gravite</label>
              <select className="form-select" name="gravite" value={formData.gravite} onChange={handleChange} required>
                <option value="Faible">Faible</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Grave">Grave</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input className="form-control" type="date" name="dateFaute" value={formData.dateFaute} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Description et actions</h3>

          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Mesures correctives</label>
            <textarea className="form-control" name="mesuresCorrectives" value={formData.mesuresCorrectives} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Commentaire</label>
            <textarea className="form-control" name="commentaire" value={formData.commentaire} onChange={handleChange} />
          </div>
        </div>

        <div className="form-section">
          <h3>Signature electronique</h3>
          <div className="signature-pad">
            <canvas
              ref={canvasRef}
              width="520"
              height="160"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(`/paq-dossier/${matricule}`)}
            className="btn btn-secondary"
            disabled={saving}
          >
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Enregistrement..." : "Valider et enregistrer"}
          </button>
        </div>
      </form>

      {showDefautModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Ajouter un type de defaut</h3>
            <div className="form-group">
              <label>Type de defaut</label>
              <input
                type="text"
                value={defautTypeInput}
                onChange={(e) => setDefautTypeInput(e.target.value)}
                placeholder="Ex: Mauvais sertissage"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDefautModal(false)}>
                Annuler
              </button>
              <button type="button" className="btn btn-primary" onClick={addTypeOption}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

