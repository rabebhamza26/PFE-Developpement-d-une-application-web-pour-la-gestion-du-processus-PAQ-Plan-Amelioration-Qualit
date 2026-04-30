import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  collaboratorService,
  entretienService,
  entretienDaccordService,
  fauteService,
  userService,
} from "../../services/api";

import "../../styles/paq-dossier.css";
import "../../styles/entretien-explicatif.css";
import "../../styles/entretien-accord.css";

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

export default function EntretienDaccord({ niveau = 2 }) {
  const { matricule } = useParams();
  const navigate = useNavigate();

  const slCanvasRef = useRef(null);
  const qmCanvasRef = useRef(null);

  const [collaborator, setCollaborator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [resumeN1, setResumeN1] = useState(null);
  const [currentEntretienId, setCurrentEntretienId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [typeOptions, setTypeOptions] = useState([]);
  const [showDefautModal, setShowDefautModal] = useState(false);
  const [defautTypeInput, setDefautTypeInput] = useState("");
  const [isDrawingSL, setIsDrawingSL] = useState(false);
  const [isDrawingQM, setIsDrawingQM] = useState(false);
  const [signatureSL, setSignatureSL] = useState("");
  const [signatureQMSegment, setSignatureQMSegment] = useState("");
  const [emailsList, setEmailsList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const [formData, setFormData] = useState({
    typeFaute: "",
    validationMesures: false,
    commentaireQMSegment: "",
    echanges: "",
    mesuresProposees: "",
    dateEntretien: new Date().toISOString().split("T")[0],
  });

  // Charger les emails des utilisateurs
const loadEmails = async () => {
  try {
    setLoadingEmails(true);
    const res = await userService.getAllEmails();  // Changement ici
    const emails = res.data || [];
    setEmailsList(emails);
  } catch (err) {
    console.error("Erreur chargement emails:", err);
    
  } finally {
    setLoadingEmails(false);
  }
};

  useEffect(() => {
    loadData();
    loadFautes();
    loadEmails();
  }, [matricule]);

  useEffect(() => {
    if (!matricule) return;
    loadDraft();
  }, [matricule]);

  const loadFautes = async () => {
    try {
      const res = await fauteService.getAll();
      setTypeOptions(res.data.map(f => f.nom));
    } catch (err) { console.error("Erreur chargement fautes:", err); }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const collabRes = await collaboratorService.getById(matricule);
      setCollaborator(collabRes.data);

      try {
        const entRes = await entretienService.getByMatricule(matricule);
        const list = Array.isArray(entRes.data) ? entRes.data : [];
        const last = list[list.length - 1];
        if (last) {
          setResumeN1({
            typeFaute: last.typeFaute,
            dateFaute: last.dateFaute || last.dateEntretien,
            description: last.description,
            mesuresCorrectives: last.mesuresCorrectives,
            commentaire: last.commentaire,
          });
        }
      } catch { /* pas bloquant */ }
    } catch (err) {
      setError("Impossible de charger les informations.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(`entretien-daccord-draft-${matricule}`);
      if (!draft) return;
      const parsed = JSON.parse(draft);
      setFormData(prev => ({ ...prev, ...parsed }));
      if (parsed.signatureSL) setSignatureSL(parsed.signatureSL);
      if (parsed.signatureQMSegment) setSignatureQMSegment(parsed.signatureQMSegment);
      if (parsed.id) setCurrentEntretienId(parsed.id);

      if (parsed.signatureSL) requestAnimationFrame(() => applySignatureToCanvas(parsed.signatureSL, slCanvasRef));
      if (parsed.signatureQMSegment) requestAnimationFrame(() => applySignatureToCanvas(parsed.signatureQMSegment, qmCanvasRef));
    } catch (err) { console.warn("Brouillon non chargeable:", err); }
  };

  // Canvas functions
  const getCanvasPoint = (event, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (event, who) => {
    event.preventDefault();
    const canvas = who === "sl" ? slCanvasRef.current : qmCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPoint(event, canvas);
    ctx.beginPath(); ctx.moveTo(x, y);
    if (who === "sl") setIsDrawingSL(true);
    else setIsDrawingQM(true);
  };

  const draw = (event, who) => {
    event.preventDefault();
    const isDrawing = who === "sl" ? isDrawingSL : isDrawingQM;
    if (!isDrawing) return;
    const canvas = who === "sl" ? slCanvasRef.current : qmCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPoint(event, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDraw = (who) => {
    const canvas = who === "sl" ? slCanvasRef.current : qmCanvasRef.current;
    if (!canvas) return;
    if (who === "sl") setIsDrawingSL(false);
    else setIsDrawingQM(false);
    const dataUrl = canvas.toDataURL("image/png");
    if (who === "sl") setSignatureSL(dataUrl);
    else setSignatureQMSegment(dataUrl);
  };

  const applySignatureToCanvas = (dataUrl, canvasRef) => {
    if (!dataUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
    img.src = dataUrl;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAjouter = () => {
    setFormData({ typeFaute: "", validationMesures: false, commentaireQMSegment: "", echanges: "", mesuresProposees: "", dateEntretien: new Date().toISOString().split("T")[0] });
    setSignatureSL(""); setSignatureQMSegment("");
    setCurrentEntretienId(null);
    [slCanvasRef, qmCanvasRef].forEach(ref => {
      if (ref.current) ref.current.getContext("2d").clearRect(0, 0, ref.current.width, ref.current.height);
    });
    setStatusMessage("Formulaire réinitialisé.");
    localStorage.removeItem(`entretien-daccord-draft-${matricule}`);
  };

  const handleModifier = () => loadDernierEntretienDaccord();

  const handleEnregistrer = () => {
    setSavingDraft(true);
    try {
      const payload = { ...formData, signatureSL, signatureQMSegment, id: currentEntretienId };
      localStorage.setItem(`entretien-daccord-draft-${matricule}`, JSON.stringify(payload));
      setStatusMessage("Brouillon enregistré avec succès.");
    } catch { setError("Impossible d'enregistrer le brouillon."); }
    finally { setSavingDraft(false); }
  };

  const handleSupprimer = async () => {
    if (!currentEntretienId) { setError("Aucun entretien chargé."); return; }
    if (!window.confirm("Supprimer cet entretien ?")) return;
    try {
      await entretienDaccordService.delete(currentEntretienId);
      setStatusMessage("Entretien supprimé.");
      setCurrentEntretienId(null);
      handleAjouter();
    } catch { setError("Erreur lors de la suppression."); }
  };

  const addTypeOption = async () => {
    const value = defautTypeInput.trim();
    if (!value) return;
    try {
      const res = await fauteService.create({ nom: value });
      const newFaute = res.data.nom;
      setTypeOptions(prev => prev.includes(newFaute) ? prev : [...prev, newFaute]);
      setFormData(prev => ({ ...prev, typeFaute: newFaute }));
      setDefautTypeInput(""); setShowDefautModal(false);
    } catch { setError("Erreur lors de l'ajout."); }
  };

  const handleConfirmEmail = async (destinataireEmail, message) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const entretienData = {
        typeFaute: formData.typeFaute,
        date: formData.dateEntretien,
        validationMesures: formData.validationMesures ? "Oui" : "Non",
        mesuresProposees: formData.mesuresProposees || "",
        commentaireQMSegment: formData.commentaireQMSegment || "",
        echanges: formData.echanges || "",
        signatureSL,
        signatureQMSegment,
        destinataireEmail, // Ajout de l'email
      };

      if (currentEntretienId) {
        await entretienDaccordService.update(matricule, currentEntretienId, entretienData);
      } else {
        await entretienDaccordService.create(matricule, entretienData);
      }

      localStorage.removeItem(`entretien-daccord-draft-${matricule}`);
      setStatusMessage("Entretien d'accord validé et email envoyé ✓");
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      console.error(err);
      setError("Erreur : " + (err.response?.data?.message || err.response?.data || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setStatusMessage("");

    if (!signatureSL || !signatureQMSegment) {
      setError("Les signatures électroniques des participants sont requises.");
      return;
    }

    // Ouvrir le modal pour choisir l'email
    setShowEmailModal(true);
  };

  const loadDernierEntretienDaccord = async () => {
    setLoadingDraft(true);
    try {
      const response = await entretienDaccordService.getByMatricule(matricule);
      const entretiens = response.data;
      if (!entretiens || entretiens.length === 0) {
        setError("Aucun entretien d'accord trouvé."); return;
      }
      const dernier = entretiens[entretiens.length - 1];
      setFormData({
        typeFaute: dernier.typeFaute || "",
        dateEntretien: dernier.date || new Date().toISOString().split("T")[0],
        validationMesures: dernier.validationMesures === "Oui",
        mesuresProposees: dernier.mesuresProposees || "",
        commentaireQMSegment: dernier.commentaireQMSegment || "",
        echanges: dernier.echanges || "",
      });
      setCurrentEntretienId(dernier.id);
      if (dernier.signatureSL) { setSignatureSL(dernier.signatureSL); requestAnimationFrame(() => applySignatureToCanvas(dernier.signatureSL, slCanvasRef)); }
      if (dernier.signatureQMSegment) { setSignatureQMSegment(dernier.signatureQMSegment); requestAnimationFrame(() => applySignatureToCanvas(dernier.signatureQMSegment, qmCanvasRef)); }
      setStatusMessage("Dernier entretien chargé.");
    } catch { setError("Impossible de charger le dernier entretien."); }
    finally { setLoadingDraft(false); }
  };

  if (loading) return (
    <div className="leoni-loading">
      <div className="leoni-spinner"></div>
      <p>Chargement...</p>
    </div>
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "–";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR");
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
            <h1>Entretien d'accord</h1>
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
                  {collaborator.name || "–"} {collaborator.prenom || ""}
                </div>
                <div className="leoni-collab-info-grid">
                  <div className="leoni-info-item">
                    <span className="leoni-info-label">Matricule</span>
                    <span className="leoni-info-value leoni-mono">{collaborator.matricule || "–"}</span>
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

          <div className="leoni-card">
            <div className="leoni-card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 016.5 22H20V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14.5z" stroke="currentColor" strokeWidth="2" />
              </svg>
              Résumé — Entretien explicatif
            </div>
            <div className="leoni-card-body">
              {resumeN1 ? (
                <div className="leoni-form-stack">
                  <div className="leoni-form-group">
                    <label>Type faute:</label>
                    <p className="leoni-readonly">{resumeN1.typeFaute || "–"}</p>
                  </div>
                  <div className="leoni-form-group">
                    <label>Date:</label>
                    <p className="leoni-readonly">{formatDate(resumeN1.dateFaute)}</p>
                  </div>
                  <div className="leoni-form-group">
                    <label>Description:</label>
                    <p className="leoni-readonly">{resumeN1.description || "–"}</p>
                  </div>
                  <div className="leoni-form-group">
                    <label>Mesures Correctives:</label>
                    <p className="leoni-readonly">{resumeN1.mesuresCorrectives || "–"}</p>
                  </div>
                  <div className="leoni-form-group">
                    <label>Commentaire:</label>
                    <p className="leoni-readonly">{resumeN1.commentaire || "–"}</p>
                  </div>
                </div>
              ) : (
                <p className="leoni-muted">Aucun entretien niveau 1 trouvé.</p>
              )}
            </div>
          </div>
        </div>

        <div className="leoni-col-right">
          <div className="leoni-card">
            <div className="leoni-card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" />
              </svg>
              Formulaire
            </div>
            <div className="leoni-card-body">
              <form onSubmit={handleSubmit} className="leoni-form-stack">
                <div className="leoni-form-group">
                  <label>Type de faute</label>
                  <div className="leoni-inline leoni-inline-reverse">
                    <button type="button" className="leoni-btn leoni-btn-warning leoni-btn-sm" onClick={() => setShowDefautModal(true)}>
                      + Ajouter faute
                    </button>
                    <div className="leoni-dropdown-container" style={{ flex: 1 }}>
                      <input
                        type="text"
                        className="leoni-input leoni-dropdown-input"
                        placeholder="Rechercher faute..."
                        value={formData.typeFaute}
                        onChange={e => { setFormData(p => ({ ...p, typeFaute: e.target.value })); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      />
                      {showDropdown && typeOptions.length > 0 && (
                        <ul className="leoni-dropdown-list">
                          {typeOptions
                            .filter(o => o.toLowerCase().includes((formData.typeFaute || "").toLowerCase()))
                            .map((opt, i) => (
                              <li key={i} className="leoni-dropdown-item"
                                onMouseDown={() => { setFormData(p => ({ ...p, typeFaute: opt })); setShowDropdown(false); }}>
                                {opt}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="leoni-form-grid">
                  <div className="leoni-form-group">
                    <label>Date entretien</label>
                    <input type="date" name="dateEntretien" value={formData.dateEntretien} onChange={handleChange} className="leoni-input" />
                  </div>
                  <div className="leoni-form-group leoni-checkbox-group">
                    <label>Validation QM-Segment</label>
                    <input type="checkbox" name="validationMesures" checked={formData.validationMesures} onChange={handleChange} className="leoni-checkbox" />
                  </div>
                </div>

                <div className="leoni-form-group">
                  <label>Mesures correctives proposées</label>
                  <textarea name="mesuresProposees" value={formData.mesuresProposees} onChange={handleChange} className="leoni-textarea" rows="3" />
                </div>

                <div className="leoni-form-group">
                  <label>Discussion SL / QM-Segment</label>
                  <textarea name="echanges" value={formData.echanges} onChange={handleChange} className="leoni-textarea" rows="3" />
                </div>

                <div className="leoni-form-group">
                  <label>Commentaires QM-Segment</label>
                  <textarea name="commentaireQMSegment" value={formData.commentaireQMSegment} onChange={handleChange} className="leoni-textarea" rows="3" />
                </div>

                <div className="leoni-form-grid">
                  <div className="leoni-form-group">
                    <label>Signature SL</label>
                    <div className="leoni-signature-box">
                      <canvas ref={slCanvasRef} width="520" height="160" className="leoni-signature-canvas"
                        onMouseDown={e => startDraw(e, "sl")} onMouseMove={e => draw(e, "sl")} onMouseUp={() => endDraw("sl")}
                        onTouchStart={e => startDraw(e, "sl")} onTouchMove={e => draw(e, "sl")} onTouchEnd={() => endDraw("sl")}
                      />
                    </div>
                  </div>
                  <div className="leoni-form-group">
                    <label>Signature QM-Segment</label>
                    <div className="leoni-signature-box">
                      <canvas ref={qmCanvasRef} width="520" height="160" className="leoni-signature-canvas"
                        onMouseDown={e => startDraw(e, "qm")} onMouseMove={e => draw(e, "qm")} onMouseUp={() => endDraw("qm")}
                        onTouchStart={e => startDraw(e, "qm")} onTouchMove={e => draw(e, "qm")} onTouchEnd={() => endDraw("qm")}
                      />
                    </div>
                  </div>
                </div>

                <div className="leoni-form-actions">
                  <button type="button" className="leoni-btn leoni-btn-success" onClick={handleAjouter}>Ajouter</button>
                  <button type="button" className="leoni-btn leoni-btn-primary" onClick={handleModifier} disabled={loadingDraft}>
                    {loadingDraft ? "Chargement..." : "Modifier"}
                  </button>
                  <button type="button" className="leoni-btn leoni-btn-outline-dark" onClick={handleEnregistrer} disabled={savingDraft}>
                    {savingDraft ? "Enregistrement..." : "Brouillon"}
                  </button>
                  <button type="submit" className="leoni-btn leoni-btn-primary" disabled={saving}>
                    {saving ? "Validation..." : "Valider"}
                  </button>
                  <button type="button" className="leoni-btn leoni-btn-danger" onClick={handleSupprimer}>
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
          <div className="leoni-modal" onClick={e => e.stopPropagation()}>
            <div className="leoni-modal-header">
              <div className="leoni-modal-icon leoni-modal-icon-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3>Ajouter une faute</h3>
                <p>Enregistrer un nouveau type de faute</p>
              </div>
              <button className="leoni-modal-close" onClick={() => setShowDefautModal(false)}>✕</button>
            </div>
            <div className="leoni-modal-body">
              <div className="leoni-form-group">
                <label>Type de faute</label>
                <input type="text" value={defautTypeInput}
                  onChange={e => setDefautTypeInput(e.target.value)}
                  className="leoni-input" placeholder="Ajouter Faute" />
              </div>
            </div>
            <div className="leoni-modal-footer">
              <button type="button" className="leoni-btn leoni-btn-outline" onClick={() => setShowDefautModal(false)}>Annuler</button>
              <button type="button" className="leoni-btn leoni-btn-warning" onClick={addTypeOption}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}