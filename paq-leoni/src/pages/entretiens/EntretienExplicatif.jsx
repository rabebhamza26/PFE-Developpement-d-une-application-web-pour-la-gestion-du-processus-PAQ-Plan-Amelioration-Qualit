import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collaboratorService, paqService, entretienService } from "../../services/api";
import { fauteService, userService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import "../../styles/paq-dossier.css";
import "../../styles/entretien-explicatif.css";

// Composant Modal Email
function EmailModal({ isOpen, onClose, onConfirm, emailsList, loadingEmails }) {
  const [selectedEmail, setSelectedEmail] = useState("");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  return (
    <div className="leoni-modal-overlay" onClick={onClose}>
      <div className="leoni-modal" style={{ maxWidth: "500px" }} onClick={e => e.stopPropagation()}>
        <div className="leoni-modal-header">
          <div className="leoni-modal-icon leoni-modal-icon-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
              <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <h3>Envoyer un email</h3>
            <p>Choisissez le destinataire et ajoutez un message</p>
          </div>
          <button className="leoni-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="leoni-modal-body">
          <div className="leoni-form-group">
            <label>Destinataire *</label>
            <select 
              className="leoni-input" 
              value={selectedEmail} 
              onChange={(e) => setSelectedEmail(e.target.value)}
              disabled={loadingEmails}
            >
              <option value="">-- Sélectionnez un email --</option>
              {emailsList.map((email, idx) => (
                <option key={idx} value={email}>{email}</option>
              ))}
            </select>
            {loadingEmails && <small>Chargement des emails...</small>}
          </div>

          <div className="leoni-form-group">
            <label>Message (optionnel)</label>
            <textarea
              className="leoni-textarea"
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ajoutez un message personnalisé..."
            />
          </div>
        </div>

        <div className="leoni-modal-footer">
          <button type="button" className="leoni-btn leoni-btn-outline" onClick={onClose}>
            Annuler
          </button>
          <button 
            type="button" 
            className="leoni-btn leoni-btn-primary" 
            onClick={() => onConfirm(selectedEmail, message)}
            disabled={!selectedEmail}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

const buildDefaultForm = () => ({
  typeFaute: "",
  dateFaute: new Date().toISOString().split("T")[0],
  description: "",
  mesuresCorrectives: "",
  commentaire: "",
});

export default function EntretienExplicatif({ niveau = 1 }) {
  const { matricule } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const { user } = useAuth();

  const [collaborator, setCollaborator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [existingLoaded, setExistingLoaded] = useState(false);
  const [currentEntretienId, setCurrentEntretienId] = useState(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureBase64, setSignatureBase64] = useState("");
  
  const [showDefautModal, setShowDefautModal] = useState(false);
  const [defautTypeInput, setDefautTypeInput] = useState("");
  const [typeOptions, setTypeOptions] = useState([]);

  const [formData, setFormData] = useState(buildDefaultForm());

  const [search, setSearch] = useState("");
  const [filteredFautes, setFilteredFautes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // États pour le modal email
  const [emailsList, setEmailsList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  // Charger les emails des utilisateurs
  const loadEmails = async () => {
    try {
      setLoadingEmails(true);
      const res = await userService.getAllEmails();
      const emails = res.data || [];
      setEmailsList(emails);
    } catch (err) {
      console.error("Erreur chargement emails:", err);
      // Emails par défaut en cas d'erreur
      setEmailsList([
        "rh@leoni.com",
        "qm.segment@leoni.com",
        "sl@leoni.com",
        "sgl@leoni.com",
        "hp@leoni.com"
      ]);
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    const q = search.toLowerCase();
    const filtered = typeOptions.filter(f =>
      f.toLowerCase().includes(q)
    );
    setFilteredFautes(filtered);
  }, [search, typeOptions]);

  useEffect(() => {
    loadFautes();
    loadEmails();
  }, []);

  useEffect(() => {
    loadCollaborator();
    loadExistingEntretien();
  }, [matricule]);

  useEffect(() => {
    if (!matricule || existingLoaded) return;
    try {
      const draft = localStorage.getItem(`entretien-explicatif-draft-${matricule}`);
      if (draft) {
        const parsed = JSON.parse(draft);
        setFormData((prev) => ({ ...prev, ...parsed }));
        if (parsed.signatureBase64) setSignatureBase64(parsed.signatureBase64);
        setStatusMessage("Brouillon chargé avec succès.");
      }
    } catch (err) {
      console.warn("Impossible de charger le brouillon:", err);
    }
  }, [matricule, existingLoaded]);

  const loadCollaborator = async () => {
    try {
      setLoading(true);
      const res = await collaboratorService.getById(matricule);
      setCollaborator(res.data);
    } catch (err) {
      setError("Impossible de charger les informations du collaborateur");
    } finally {
      setLoading(false);
    }
  };

  const loadFautes = async () => {
    try {
      const res = await fauteService.getAll();
      const fautes = res.data || [];
      setTypeOptions(fautes.map((f) => f.nom));
    } catch (err) {
      console.error("Erreur chargement fautes", err);
    }
  };

  const getEntretienCandidates = (paq, niveauKey) => {
    if (!paq || typeof paq !== "object") return [];
    const candidates = [];
    const keyMap = {
      1: ["premierEntretien", "entretienExplicatif", "entretienExplication", "entretienPremier", "entretien1", "entretien_1"],
      2: ["deuxiemeEntretien", "entretienAccord", "entretien2", "entretien_2"],
      3: ["troisiemeEntretien", "entretienMesure", "entretien3", "entretien_3"],
      4: ["quatriemeEntretien", "entretienDecision", "entretien4", "entretien_4"],
      5: ["cinquiemeEntretien", "entretienFinal", "entretien5", "entretien_5"],
    };

    (keyMap[niveauKey] || []).forEach((key) => {
      if (paq[key]) candidates.push(paq[key]);
    });

    if (Array.isArray(paq.entretiens)) {
      paq.entretiens.forEach((item) => candidates.push(item));
    }

    Object.values(paq).forEach((value) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        if ("typeFaute" in value || "description" in value) {
          candidates.push(value);
        }
      }
    });

    return candidates;
  };

  const normalizeEntretien = (entretien) => {
    if (!entretien || typeof entretien !== "object") return null;
    return {
      id: entretien.id,
      typeFaute: entretien.typeFaute || entretien.type || "",
      dateFaute: entretien.date || entretien.dateFaute || new Date().toISOString().split("T")[0],
      description: entretien.description || "",
      mesuresCorrectives: entretien.mesuresCorrectives || entretien.mesures || "",
      commentaire: entretien.notes || entretien.commentaire || "",
      signatureBase64: entretien.signatureBase64 || "",
    };
  };

  const applySignatureToCanvas = (dataUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!dataUrl) return;

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, w, h);
    };
    img.src = dataUrl;
  };

  const applyEntretienToForm = (normalized) => {
    if (!normalized) return;
    setCurrentEntretienId(normalized.id);
    setFormData((prev) => ({
      ...prev,
      typeFaute: normalized.typeFaute,
      dateFaute: normalized.dateFaute,
      description: normalized.description,
      mesuresCorrectives: normalized.mesuresCorrectives,
      commentaire: normalized.commentaire,
    }));

    if (normalized.typeFaute && !typeOptions.includes(normalized.typeFaute)) {
      setTypeOptions((prev) => [...prev, normalized.typeFaute]);
    }

    if (normalized.signatureBase64) {
      setSignatureBase64(normalized.signatureBase64);
      requestAnimationFrame(() => applySignatureToCanvas(normalized.signatureBase64));
    }
  };

  const getEntretienTimestamp = (item) => {
    if (!item || typeof item !== "object") return 0;
    const raw =
      item.date ||
      item.dateFaute ||
      item.dateEntretien ||
      item.createdAt ||
      item.updatedAt ||
      null;
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  const pickLatestEntretien = (list) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.reduce((best, cur) => {
      if (!best) return cur;
      const tb = getEntretienTimestamp(best);
      const tc = getEntretienTimestamp(cur);
      if (tc !== tb) return tc > tb ? cur : best;
      const ib = Number(best.id || 0);
      const ic = Number(cur.id || 0);
      if (Number.isFinite(ic) && Number.isFinite(ib) && ic !== ib) return ic > ib ? cur : best;
      return best;
    }, null);
  };

  const loadExistingEntretien = async () => {
    try {
      const res = await paqService.getByMatricule(matricule);
      const paq = res?.data?.paq || res?.data;
      if (!paq) return;
      const candidates = getEntretienCandidates(paq, niveau);
      if (candidates.length === 0) return;

      const normalized = normalizeEntretien(candidates[0]);
      if (!normalized) return;

      applyEntretienToForm(normalized);
      setStatusMessage("Entretien existant chargé pour modification.");
      setExistingLoaded(true);
    } catch (err) {
      console.warn("Impossible de charger l'entretien existant:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const addTypeOption = async () => {
    const value = defautTypeInput.trim();
    if (!value) return;

    try {
      const res = await fauteService.create({ nom: value });
      const newFaute = res.data;

      setTypeOptions((prev) => [...prev, newFaute.nom]);
      setFormData((prev) => ({ ...prev, typeFaute: newFaute.nom }));

      setDefautTypeInput("");
      setShowDefautModal(false);
      setStatusMessage("Type de défaut ajouté avec succès.");
    } catch (err) {
      setError("Erreur lors de l'ajout du défaut.");
    }
  };

  const handleAjouter = () => {
    setFormData(buildDefaultForm());
    setSignatureBase64("");
    setStatusMessage("Nouveau formulaire prêt à être rempli.");
    setError("");
    if (matricule) localStorage.removeItem(`entretien-explicatif-draft-${matricule}`);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleModifier = async () => {
    setStatusMessage("");

    try {
      const res = await entretienService.getByMatricule(matricule);
      const list = Array.isArray(res.data) ? res.data : [];

      if (list.length === 0) {
        setError("Aucun entretien trouvé.");
        return;
      }

      const latest = pickLatestEntretien(list);
      applyEntretienToForm(normalizeEntretien(latest));
      setStatusMessage("Entretien chargé pour modification.");
      setExistingLoaded(true);
    } catch (err) {
      setError("Erreur lors du chargement.");
    }
  };

  const handleEnregistrer = () => {
    setSavingDraft(true);
    setStatusMessage("");

    try {
      const payload = { ...formData, signatureBase64 };
      localStorage.setItem(`entretien-explicatif-draft-${matricule}`, JSON.stringify(payload));
      setStatusMessage("Brouillon enregistré avec succès.");
    } catch (err) {
      setError("Impossible d'enregistrer le brouillon.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSupprimer = async () => {
    if (!currentEntretienId) {
      setError("Aucun entretien chargé pour suppression.");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet entretien ?")) {
      return;
    }

    try {
      await entretienService.delete(currentEntretienId);
      handleAjouter();
      setStatusMessage("Entretien supprimé avec succès.");
      setCurrentEntretienId(null);
      setExistingLoaded(false);
      setFormData(buildDefaultForm());
      localStorage.removeItem(`entretien-explicatif-draft-${matricule}`);
    } catch (err) {
      setError("Erreur lors de la suppression de l'entretien.");
    }
  };

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event) => {
    event.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPoint(event);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0f172a";
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

  const handleConfirmEmail = async (destinataireEmail, message) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const entretienData = {
        notes: formData.commentaire || "",
        date: formData.dateFaute,
        signatureBase64,
        typeFaute: formData.typeFaute,
        description: formData.description,
        mesuresCorrectives: formData.mesuresCorrectives,
        destinataireEmail: destinataireEmail,
      };

      if (currentEntretienId) {
        await entretienService.update(matricule, currentEntretienId, entretienData);
        setStatusMessage("Entretien modifié avec succès. Email envoyé.");
      } else {
        await entretienService.create(matricule, entretienData);
        setStatusMessage("Entretien créé avec succès. Email envoyé.");
      }

      localStorage.removeItem(`entretien-explicatif-draft-${matricule}`);
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      setError("Erreur : " + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");

    if (!signatureBase64) {
      setError("Signature électronique requise");
      return;
    }

    // Ouvrir le modal pour choisir l'email
    setShowEmailModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR");
  };

  if (loading) {
    return (
      <div className="leoni-loading">
        <div className="leoni-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  const fieldLabels = {
    description: "Description de la faute",
    mesuresCorrectives: "Mesures correctives",
    commentaire: "Commentaire",
  };

  return (
    <div className="leoni-shell">
      <div className="leoni-header">
        <div className="leoni-header-left">
          <button onClick={() => navigate(`/paq-dossier/${matricule}`)} className="leoni-btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour
          </button>
        </div>

        <div className="leoni-header-title">
          <div className="leoni-logo-bar">
            <div className="leoni-logo-accent"></div>
            <h1>Entretien explicatif</h1>
          </div>
          {collaborator && (
            <span className="leoni-header-sub">
              {(collaborator.name || "").trim()} {(collaborator.prenom || "").trim()} — {collaborator.matricule || matricule}
            </span>
          )}
        </div>

        <div className="leoni-header-actions" />
      </div>

      {statusMessage && <div className="leoni-alert leoni-alert-success">{statusMessage}</div>}
      {error && <div className="leoni-alert leoni-alert-error">{error}</div>}

      <div className="leoni-grid-main">
        <div className="leoni-col-left">
          {collaborator && (
            <div className="leoni-card">
              <div className="leoni-card-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
                Informations Collaborateur
              </div>
              <div className="leoni-card-body">
                <div className="leoni-collab-avatar">
                  {`${collaborator.name?.[0] || ""}${collaborator.prenom?.[0] || ""}`.toUpperCase()}
                </div>
                <div className="leoni-collab-name">
                  {collaborator.name || "-"} {collaborator.prenom || ""}
                </div>
                <div className="leoni-collab-info-grid">
                  <div className="leoni-info-item">
                    <span className="leoni-info-label">Matricule</span>
                    <span className="leoni-info-value leoni-mono">{collaborator.matricule || "-"}</span>
                  </div>
                  <div className="leoni-info-item">
                    <span className="leoni-info-label">Segment</span>
                    <span className="leoni-info-value">{collaborator.segment || "–"}</span>
                  </div>
                  <div className="leoni-info-item">
                    <span className="leoni-info-label">Date d'embauche</span>
                    <span className="leoni-info-value leoni-mono">{formatDate(collaborator.hireDate)}</span>
                  </div>
                  <div className="leoni-info-item">
                    <span className="leoni-info-label">Statut</span>
                    <span className="leoni-info-value">{collaborator.status || "–"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="leoni-col-right">
          <div className="leoni-card">
            <div className="leoni-card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Formulaire
            </div>
            <div className="leoni-card-body">
              <form id="entretien-explicatif-form" onSubmit={handleSubmit} className="leoni-form-stack">
                <div className="leoni-form-grid">
                  <div className="leoni-form-group">
                    <label>Type de faute</label>
                    <div className="leoni-inline">
                      <button
                        type="button"
                        onClick={() => setShowDefautModal(true)}
                        className="leoni-btn leoni-btn-warning leoni-btn-sm"
                      >
                        + Ajouter faute
                      </button>

                      <div className="leoni-dropdown-container">
                        <input
                          type="text"
                          placeholder="Rechercher faute"
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setShowDropdown(true);
                          }}
                          className="leoni-input"
                        />

                        {showDropdown && (
                          <div className="leoni-dropdown">
                            {filteredFautes.length > 0 ? (
                              filteredFautes.map((f, index) => (
                                <div
                                  key={index}
                                  className="leoni-dropdown-item"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      typeFaute: f
                                    }));
                                    setSearch(f);
                                    setShowDropdown(false);
                                  }}
                                >
                                  {f}
                                </div>
                              ))
                            ) : (
                              <div className="leoni-dropdown-empty">Aucun résultat</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="leoni-form-group">
                  <label>Date de l'entretien</label>
                  <input type="date" name="dateFaute" value={formData.dateFaute} onChange={handleChange} className="leoni-input" />
                </div>

                <div className="leoni-form-group">
                  <label>Cause de faute</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="leoni-textarea" rows="3" />
                </div>

                <div className="leoni-form-group">
                  <label>{fieldLabels.mesuresCorrectives}</label>
                  <textarea name="mesuresCorrectives" value={formData.mesuresCorrectives} onChange={handleChange} className="leoni-textarea" rows="3" />
                </div>

                <div className="leoni-form-group">
                  <label>{fieldLabels.commentaire}</label>
                  <textarea name="commentaire" value={formData.commentaire} onChange={handleChange} className="leoni-textarea" rows="3" />
                </div>

                <div className="leoni-form-group">
                  <label>Signature électronique</label>
                  <div className="leoni-signature-box">
                    <canvas
                      ref={canvasRef}
                      width="520"
                      height="160"
                      className="leoni-signature-canvas"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const canvas = canvasRef.current;
                      const ctx = canvas.getContext("2d");
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      setSignatureBase64("");
                    }}
                    className="leoni-btn leoni-btn-sm leoni-btn-outline"
                    style={{ marginTop: '8px' }}
                  >
                    Effacer la signature
                  </button>
                </div>

                <div className="leoni-form-actions">
                  <button type="button" onClick={handleAjouter} className="leoni-btn leoni-btn-success">
                    Ajouter
                  </button>
                  <button type="button" onClick={handleModifier} className="leoni-btn leoni-btn-primary">
                    Modifier
                  </button>
                  <button type="button" onClick={handleEnregistrer} className="leoni-btn leoni-btn-outline-dark" disabled={savingDraft}>
                    {savingDraft ? "Enregistrement..." : "Brouillon"}
                  </button>
                  <button
                    type="submit"
                    className="leoni-btn leoni-btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Validation..." : "Valider"}
                  </button>
                  <button type="button" onClick={handleSupprimer} className="leoni-btn leoni-btn-danger" disabled={!currentEntretienId}>
                    Supprimer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal email */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onConfirm={handleConfirmEmail}
        emailsList={emailsList}
        loadingEmails={loadingEmails}
      />

      {/* Modal ajout faute */}
      {showDefautModal && (
        <div className="leoni-modal-overlay" onClick={() => setShowDefautModal(false)}>
          <div className="leoni-modal" onClick={(e) => e.stopPropagation()}>
            <div className="leoni-modal-header">
              <div className="leoni-modal-icon leoni-modal-icon-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <h3>Ajouter une faute</h3>
                <p>Enregistrer un nouveau type de faute</p>
              </div>
              <button className="leoni-modal-close" onClick={() => setShowDefautModal(false)}>
                ✕
              </button>
            </div>

            <div className="leoni-modal-body">
              <div className="leoni-form-group">
                <label>Type de faute</label>
                <input
                  type="text"
                  value={defautTypeInput}
                  onChange={(e) => setDefautTypeInput(e.target.value)}
                  className="leoni-input"
                  placeholder="saisie faute"
                />
              </div>
            </div>

            <div className="leoni-modal-footer">
              <button type="button" className="leoni-btn leoni-btn-outline" onClick={() => setShowDefautModal(false)}>
                Annuler
              </button>
              <button type="button" className="leoni-btn leoni-btn-warning" onClick={addTypeOption}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}