import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/paq-dossier.css";
import { paqService } from "../../services/api";

export default function EntretienExplicatif({ niveau = 1 }) {
  const { matricule } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [formData, setFormData] = useState({
    typeFaute: "",
    gravite: "Faible",
    dateFaute: new Date().toISOString().split("T")[0],
    description: "",
    mesuresCorrectives: "",
    commentaire: "",
  });
  const [signatureBase64, setSignatureBase64] = useState("");
  const [collaborator, setCollaborator] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);

  const entretienApi = `/api/paq/${matricule}/entretien/${niveau}`; // endpoint dynamique selon le niveau

  // Charger le collaborateur
  useEffect(() => {
    const loadCollaborator = async () => {
      try {
        const res = await axios.get(`/api/collaborators/${matricule}`);
        setCollaborator(res.data);
      } catch (err) {
        setError("Impossible de charger le collaborateur");
      }
    };
    loadCollaborator();
  }, [matricule]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Gestion du canvas signature
  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (event) => {
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getCanvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getCanvasPoint(event);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureBase64(canvas.toDataURL("image/png"));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  if (!signatureBase64) {
    setError("Signature requise");
    return;
  }
  setSaving(true);

  const payload = { ...formData, signatureBase64 };

  try {
    switch (niveau) {
      case 1:
        await paqService.createPremierEntretien(matricule, payload);
        break;
      case 2:
        await paqService.createDeuxiemeEntretien(matricule, payload);
        break;
      case 3:
        await paqService.createTroisiemeEntretien(matricule, payload);
        break;
      case 4:
        await paqService.createQuatriemeEntretien(matricule, payload);
        break;
      case 5:
        await paqService.createCinquiemeEntretien(matricule, payload);
        break;
      default:
        throw new Error("Niveau invalide");
    }

    navigate(`/paq-dossier/${matricule}`);
  } catch (err) {
    console.error("Erreur soumission entretien:", err);
    setError("Erreur lors de l'enregistrement");
  } finally {
    setSaving(false);
  }
};

  if (!collaborator) return <div>Chargement...</div>;

  return (
    <div className="paq-shell">
      <h1>
        Entretien {niveau} - {collaborator.name}
      </h1>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Type de faute:</label>
        <input
          name="typeFaute"
          value={formData.typeFaute}
          onChange={handleChange}
          required
        />

        <label>Gravité:</label>
        <select name="gravite" value={formData.gravite} onChange={handleChange}>
          <option value="Faible">Faible</option>
          <option value="Moyenne">Moyenne</option>
          <option value="Grave">Grave</option>
        </select>

        <label>Date:</label>
        <input
          type="date"
          name="dateFaute"
          value={formData.dateFaute}
          onChange={handleChange}
        />

        <label>Description:</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
        />

        <label>Mesures correctives:</label>
        <textarea
          name="mesuresCorrectives"
          value={formData.mesuresCorrectives}
          onChange={handleChange}
        />

        <label>Commentaire:</label>
        <textarea
          name="commentaire"
          value={formData.commentaire}
          onChange={handleChange}
        />

        <label>Signature:</label>
        <canvas
          ref={canvasRef}
          width={520}
          height={160}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          style={{ border: "1px solid #000", display: "block", marginBottom: 10 }}
        />

        <button type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : "Valider et envoyer"}
        </button>
      </form>
    </div>
  );
}