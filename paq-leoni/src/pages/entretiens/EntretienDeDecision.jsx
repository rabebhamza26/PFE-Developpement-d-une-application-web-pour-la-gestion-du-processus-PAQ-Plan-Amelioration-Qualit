import React, { useEffect, useRef, useState } from "react";
import {
  collaboratorService, paqService,
  entretienMesureService, entretienDaccordService,
  entretienService, entretienDecisionService,
  fauteService, userService,
} from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/entretien-decision.css";
import "../../styles/paq-dossier.css";

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
          <button type="button" className="leoni-btn leoni-btn-outline" onClick={onClose}>Annuler</button>
          <button type="button" className="leoni-btn leoni-btn-primary" onClick={() => onConfirm(selectedEmail, message)} disabled={!selectedEmail}>
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EntretienDeDecision({ niveau = 4 }) {
  const { matricule } = useParams();
  const navigate = useNavigate();

  const canvasQM  = useRef(null);
  const canvasSGL = useRef(null);
  const canvasSL  = useRef(null);

  const [collaborator,       setCollaborator]       = useState(null);
  const [resumeN1,           setResumeN1]           = useState(null);
  const [resumeN2,           setResumeN2]           = useState(null);
  const [resumeN3,           setResumeN3]           = useState(null);
  const [currentEntretienId, setCurrentEntretienId] = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [saving,             setSaving]             = useState(false);
  const [savingDraft,        setSavingDraft]        = useState(false);
  const [error,              setError]              = useState("");
  const [statusMessage,      setStatusMessage]      = useState("");
  const [showDefautModal,    setShowDefautModal]    = useState(false);
  const [defautTypeInput,    setDefautTypeInput]    = useState("");
  const [typeOptions,        setTypeOptions]        = useState([]);
  const [showDropdown,       setShowDropdown]       = useState(false);

  // États pour le modal email
  const [emailsList, setEmailsList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [formData, setFormData] = useState({
    typeFaute:     "",
    dateEntretien: new Date().toISOString().split("T")[0],
    decision:      "",
    justification: "",
  });

  const [signatureSL,  setSignatureSL]  = useState("");
  const [signatureQM,  setSignatureQM]  = useState("");
  const [signatureSGL, setSignatureSGL] = useState("");

  const [isDrawingSL,  setIsDrawingSL]  = useState(false);
  const [isDrawingQM,  setIsDrawingQM]  = useState(false);
  const [isDrawingSGL, setIsDrawingSGL] = useState(false);

  // Charger les emails
  const loadEmails = async () => {
    try {
      setLoadingEmails(true);
      const res = await userService.getAllEmails();
      const emails = res.data || [];
      setEmailsList(emails);
    } catch (err) {
      console.error("Erreur chargement emails:", err);
      setEmailsList(["rh@leoni.com", "qm.segment@leoni.com", "sl@leoni.com", "sgl@leoni.com", "hp@leoni.com"]);
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    if (!matricule) return;
    loadData();
    loadDraft();
    loadResumes();
    loadFautes();
    loadEmails();
  }, [matricule]);

  const loadData = async () => {
    try {
      setLoading(true);
      const collab = await collaboratorService.getById(matricule);
      setCollaborator(collab.data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les données du collaborateur.");
    } finally {
      setLoading(false);
    }
  };

  const loadFautes = async () => {
    try {
      const res = await fauteService.getAll();
      setTypeOptions(res.data.map(f => f.nom));
    } catch { setTypeOptions([]); }
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(`entretien-decision-draft-${matricule}`);
      if (!draft) return;
      const parsed = JSON.parse(draft);
      setFormData(prev => ({ ...prev, ...parsed }));
      if (parsed.signatureSL)  setSignatureSL(parsed.signatureSL);
      if (parsed.signatureQM)  setSignatureQM(parsed.signatureQM);
      if (parsed.signatureSGL) setSignatureSGL(parsed.signatureSGL);
      if (parsed.signatureSL)  applySignatureToCanvas(parsed.signatureSL,  canvasSL);
      if (parsed.signatureQM)  applySignatureToCanvas(parsed.signatureQM,  canvasQM);
      if (parsed.signatureSGL) applySignatureToCanvas(parsed.signatureSGL, canvasSGL);
      setStatusMessage("Brouillon chargé avec succès.");
    } catch (err) { console.warn("Brouillon non chargeable:", err); }
  };

  const loadResumes = async () => {
    try {
      const n1 = await entretienService.getByMatricule(matricule);
      const n2 = await entretienDaccordService.getByMatricule(matricule);
      const n3 = await entretienMesureService.getByMatricule(matricule);
      setResumeN1(n1.data?.at(-1) || null);
      setResumeN2(n2.data?.at(-1) || null);
      setResumeN3(n3.data?.at(-1) || null);
    } catch (e) { console.error(e); }
  };

  const applySignatureToCanvas = (dataUrl, canvasRef) => {
    if (!dataUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const img    = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
    img.src    = dataUrl;
  };

  const loadEntretienForModification = async () => {
    try {
      setSavingDraft(true);
      setError(""); setStatusMessage("");
      const response = await entretienDecisionService.getEntretienDecisionByMatricule(matricule);
      const list     = Array.isArray(response.data) ? response.data : [];
      if (list.length === 0) { setStatusMessage("Aucun entretien de décision trouvé."); return; }
      const dernier  = list[list.length - 1];
      setCurrentEntretienId(dernier.id);
      setFormData({
        typeFaute:     dernier.typeFaute     || "",
        dateEntretien: dernier.dateEntretien || new Date().toISOString().split("T")[0],
        decision:      dernier.decision      || "",
        justification: dernier.justification || "",
      });
      setSignatureSL(dernier.signatureSL   || "");
      setSignatureQM(dernier.signatureQM   || "");
      setSignatureSGL(dernier.signatureSGL || "");
      if (dernier.signatureSL)  applySignatureToCanvas(dernier.signatureSL,  canvasSL);
      if (dernier.signatureQM)  applySignatureToCanvas(dernier.signatureQM,  canvasQM);
      if (dernier.signatureSGL) applySignatureToCanvas(dernier.signatureSGL, canvasSGL);
      if (dernier.typeFaute && !typeOptions.includes(dernier.typeFaute))
        setTypeOptions(prev => [...prev, dernier.typeFaute]);
      setStatusMessage("Entretien chargé pour modification.");
    } catch (err) {
      console.error(err);
      setError("Impossible de charger l'entretien de décision.");
    } finally { setSavingDraft(false); }
  };

  // Canvas functions
  const getCanvasPoint = (event, canvas) => {
    const rect    = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (event, who) => {
    event.preventDefault();
    const canvas = who === "sl" ? canvasSL.current : who === "qm" ? canvasQM.current : canvasSGL.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPoint(event, canvas);
    ctx.beginPath(); ctx.moveTo(x, y);
    if (who === "sl") setIsDrawingSL(true);
    else if (who === "qm") setIsDrawingQM(true);
    else setIsDrawingSGL(true);
  };

  const draw = (event, who) => {
    event.preventDefault();
    const isDrawing = who === "sl" ? isDrawingSL : who === "qm" ? isDrawingQM : isDrawingSGL;
    if (!isDrawing) return;
    const canvas = who === "sl" ? canvasSL.current : who === "qm" ? canvasQM.current : canvasSGL.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPoint(event, canvas);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDraw = (who) => {
    const canvas = who === "sl" ? canvasSL.current : who === "qm" ? canvasQM.current : canvasSGL.current;
    if (!canvas) return;
    if (who === "sl") setIsDrawingSL(false);
    else if (who === "qm") setIsDrawingQM(false);
    else setIsDrawingSGL(false);
    const dataUrl = canvas.toDataURL("image/png");
    if (who === "sl") setSignatureSL(dataUrl);
    else if (who === "qm") setSignatureQM(dataUrl);
    else setSignatureSGL(dataUrl);
  };

  const clearCanvas = (who) => {
    const ref = who === "sl" ? canvasSL : who === "qm" ? canvasQM : canvasSGL;
    if (!ref.current) return;
    ref.current.getContext("2d").clearRect(0, 0, ref.current.width, ref.current.height);
    if (who === "sl") setSignatureSL("");
    else if (who === "qm") setSignatureQM("");
    else setSignatureSGL("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addTypeOption = async () => {
    if (!defautTypeInput.trim()) return;
    try {
      const res = await fauteService.create({ nom: defautTypeInput });
      const nom = res.data.nom;
      setTypeOptions(prev => [...prev, nom]);
      setFormData(prev => ({ ...prev, typeFaute: nom }));
      setShowDefautModal(false);
      setDefautTypeInput("");
    } catch { setError("Erreur ajout faute"); }
  };

  const handleEnregistrer = () => {
    setSavingDraft(true);
    try {
      const payload = { ...formData, signatureSL, signatureQM, signatureSGL };
      localStorage.setItem(`entretien-decision-draft-${matricule}`, JSON.stringify(payload));
      setStatusMessage("Brouillon enregistré avec succès.");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch { setError("Impossible d'enregistrer le brouillon."); }
    finally { setSavingDraft(false); }
  };

  const handleAjouter = () => {
    setCurrentEntretienId(null);
    setFormData({ typeFaute:"", dateEntretien: new Date().toISOString().split("T")[0], decision:"", justification:"" });
    setSignatureSL(""); setSignatureQM(""); setSignatureSGL("");
    setStatusMessage("Nouveau formulaire prêt.");
    localStorage.removeItem(`entretien-decision-draft-${matricule}`);
    [canvasSL, canvasQM, canvasSGL].forEach(ref => {
      if (ref.current) ref.current.getContext("2d").clearRect(0, 0, ref.current.width, ref.current.height);
    });
  };

  const handleModifier = () => loadEntretienForModification();

  const handleSupprimer = async () => {
    if (!currentEntretienId) { setError("Aucun entretien chargé pour suppression."); return; }
    if (!window.confirm("Supprimer cet entretien ?")) return;
    try {
      await entretienDecisionService.deleteEntretienDecision(currentEntretienId);
      setStatusMessage("Entretien supprimé avec succès.");
      setTimeout(() => setStatusMessage(""), 3000);
      setCurrentEntretienId(null);
      handleAjouter();
    } catch { setError("Erreur lors de la suppression."); }
  };

  // MODIFIÉ : Confirmation email avant l'envoi
  const handleConfirmEmail = async (destinataireEmail, message) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const payload = { 
        ...formData, 
        signatureSL, 
        signatureQM, 
        signatureSGL,
        destinataireEmail  // Ajout de l'email
      };

      if (currentEntretienId) {
        await entretienDecisionService.updateEntretienDecision(matricule, currentEntretienId, payload);
        setStatusMessage("Entretien de décision modifié et email envoyé !");
      } else {
        await entretienDecisionService.createEntretienDecision(matricule, payload);
        setStatusMessage("Entretien de décision validé et email envoyé !");
      }

      localStorage.removeItem(`entretien-decision-draft-${matricule}`);
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      console.error(err);
      setError("Erreur : " + (err.response?.data?.message || err.message));
    } finally { 
      setSaving(false);
    }
  };

  // MODIFIÉ : Ouvre le modal au lieu d'envoyer directement
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setStatusMessage("");

    if (!formData.typeFaute)  return setError("Veuillez sélectionner un type de faute.");
    if (!formData.decision)   return setError("Veuillez saisir une décision.");
    if (!signatureSL || !signatureQM || !signatureSGL)
      return setError("Toutes les signatures sont requises.");

    // Ouvrir le modal pour choisir l'email
    setShowEmailModal(true);
  };

  const fmt = d => { if (!d) return "—"; try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; } };

  if (loading) return <div className="fd-loading">Chargement...</div>;

  return (
    <div className="decision-root">

      <div className="leoni-header">
        <div className="leoni-header-left">
          <button onClick={() => navigate(`/paq-dossier/${matricule}`)} className="leoni-btn-back">
            ← Retour au dossier
          </button>
        </div>
        <div className="leoni-header-title">
          <div className="leoni-logo-bar">
            <div className="leoni-logo-accent" />
            <h1>Entretien de Décision</h1>
          </div>
          {collaborator && (
            <span className="leoni-header-sub">
              {collaborator.name} {collaborator.prenom} — {collaborator.matricule}
            </span>
          )}
        </div>
        <div className="leoni-header-actions" />
      </div>

      <div className="decision-page">

        <aside className="decision-sidebar">
          <div className="sd-card">
            <div className="sd-card-hd">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Informations Collaborateur
            </div>
            <div className="sd-card-bd">
              <div className="sd-avatar">
                {`${collaborator?.name?.[0]||""}${collaborator?.prenom?.[0]||""}`.toUpperCase() || "?"}
              </div>
              <div className="sd-name">{collaborator?.name} {collaborator?.prenom}</div>
              <div className="sd-info-grid">
                <div className="sd-info-cell">
                  <span className="sd-info-label">Matricule</span>
                  <span className="sd-info-value">{collaborator?.matricule || "–"}</span>
                </div>
                <div className="sd-info-cell">
                  <span className="sd-info-label">Segment</span>
                  <span className="sd-info-value">{collaborator?.segment || "–"}</span>
                </div>
                <div className="sd-info-cell">
                  <span className="sd-info-label">Date embauche</span>
                  <span className="sd-info-value">{fmt(collaborator?.hireDate)}</span>
                </div>
                <div className="sd-info-cell">
                  <span className="sd-info-label">Statut</span>
                  <span className="sd-info-value green">{collaborator?.status || "ACTIF"}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="decision-main">

          <div className="resume-row">
            {[
              { title: "Entretien 1 — Explicatif", data: resumeN1, labelKey: "Mesures correctives", valKey: v => v.mesuresCorrectives || "–" },
              { title: "Entretien 2 — Accord",     data: resumeN2, labelKey: "Mesures correctives proposées", valKey: v => v.mesuresProposees   || "–" },
              { title: "Entretien 3 — Mesure",     data: resumeN3, labelKey: "Plan d'action", valKey: v => v.planAction || "–" },
            ].map((r, i) => (
              <div key={i} className="resume-mini-card">
                <div className="resume-mini-hd">{r.title}</div>
                <div className="resume-mini-bd">
                  {r.data ? (
                    <>
                      <div className="resume-mini-line">
                        <span className="resume-mini-lbl">Faute</span>
                        <span className="resume-mini-val">{r.data.typeFaute || "–"}</span>
                      </div>
                      <div className="resume-mini-line">
                        <span className="resume-mini-lbl">Date</span>
                        <span className="resume-mini-val">{fmt(r.data.date || r.data.dateFaute || r.data.dateEntretien)}</span>
                      </div>
                      <div className="resume-mini-line">
                        <span className="resume-mini-lbl">{r.labelKey}</span>
                        <span className="resume-mini-val">{r.valKey(r.data)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="resume-mini-none">Aucun entretien trouvé</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {statusMessage && (
            <div className="fd-alert fd-alert-ok">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {statusMessage}
            </div>
          )}
          {error && (
            <div className="fd-alert fd-alert-err">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <div className="form-main-card">
            <div className="leoni-card-header">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Formulaire
            </div>

            <div className="form-main-bd">
              <form onSubmit={handleSubmit}>
                <div className="fd-group">
                  <label className="fd-label">Type de faute <span className="req">*</span></label>
                  <div className="fd-faute-row">
                    <div className="fd-dw">
                      <input type="text" className="fd-inp" placeholder="Rechercher faute..."
                        value={formData.typeFaute}
                        onChange={e => { setFormData(p => ({...p, typeFaute: e.target.value})); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}/>
                      {showDropdown && typeOptions.length > 0 && (
                        <div className="fd-dlist">
                          {typeOptions.filter(o => o.toLowerCase().includes(formData.typeFaute.toLowerCase()))
                            .map((o, i) => (
                              <div key={i} className="fd-ditem" onMouseDown={() => { setFormData(p => ({...p, typeFaute: o})); setShowDropdown(false); }}>
                                {o}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <button type="button" className="fd-btn-add" onClick={() => setShowDefautModal(true)}>+ Ajouter Faute</button>
                  </div>
                </div>

                <div className="fd-row2">
                  <div className="fd-group">
                    <label className="fd-label">Date entretien</label>
                    <input type="date" name="dateEntretien" className="fd-inp" value={formData.dateEntretien} onChange={handleChange}/>
                  </div>
                  <div className="fd-group">
                    <label className="fd-label">Décision <span className="req">*</span></label>
                    <select name="decision" className="fd-sel" value={formData.decision} onChange={handleChange}>
                      <option value="">— Choisir —</option>
                      <option>Avertissement</option><option>Formation</option>
                      <option>Mutation</option><option>Suspension</option><option>Licenciement</option>
                    </select>
                  </div>
                </div>

                <div className="fd-group">
                  <label className="fd-label">Justification</label>
                  <textarea name="justification" className="fd-ta" rows={3}
                    value={formData.justification} onChange={handleChange}
                    placeholder="Motivez la décision prise lors de cet entretien..."/>
                </div>

                <div className="fd-group">
                  <label className="fd-label">Signatures <span className="req">*</span></label>
                  <div className="fd-sig-row">
                    {[
                      { label:"QM Plant", ref:canvasQM,  key:"qm",  val:signatureQM },
                      { label:"SGL / HP", ref:canvasSGL, key:"sgl", val:signatureSGL },
                      { label:"SL",       ref:canvasSL,  key:"sl",  val:signatureSL },
                    ].map(s => (
                      <div key={s.key} className="fd-sig-box">
                        <div className="fd-sig-label">{s.label}{s.val && <span className="fd-sig-ok">✓</span>}</div>
                        <canvas ref={s.ref} width={280} height={88} className="fd-canvas"
                          onMouseDown={e => startDraw(e, s.key)} onMouseMove={e => draw(e, s.key)}
                          onMouseUp={() => endDraw(s.key)} onMouseLeave={() => endDraw(s.key)}
                          onTouchStart={e => startDraw(e, s.key)} onTouchMove={e => draw(e, s.key)}
                          onTouchEnd={() => endDraw(s.key)}/>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="fd-actions">
                  <button type="button" className="fd-btn fd-btn-draft" onClick={handleEnregistrer} disabled={savingDraft}>
                    {savingDraft ? "..." : "Enregistrer Brouillon"}
                  </button>
                  <button type="submit" className="fd-btn fd-btn-valider" disabled={saving}>
                    {saving ? "..." : "Valider"}
                  </button>
                  <button type="button" className="fd-btn fd-btn-ajouter" onClick={handleAjouter}>Ajouter</button>
                  <button type="button" className="fd-btn fd-btn-modifier" onClick={handleModifier} disabled={savingDraft}>
                    {savingDraft ? "..." : "Modifier"}
                  </button>
                  <button type="button" className="fd-btn fd-btn-supprimer" onClick={handleSupprimer}>Supprimer</button>
                  <button type="button" className="fd-btn fd-btn-annuler" onClick={() => navigate(`/paq-dossier/${matricule}`)}>Annuler</button>
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
        <div className="fd-moverlay" onClick={() => setShowDefautModal(false)}>
          <div className="fd-modal" onClick={e => e.stopPropagation()}>
            <h3>Ajouter un type de faute</h3>
            <label className="fd-label">Nom du type de faute</label>
            <input className="fd-inp" style={{marginTop:6}} value={defautTypeInput}
              onChange={e => setDefautTypeInput(e.target.value)} placeholder="Ex : Ajouter Faute"
              onKeyDown={e => e.key === "Enter" && addTypeOption()} autoFocus/>
            <div className="fd-modal-acts">
              <button className="fd-mbtn-cancel" onClick={() => setShowDefautModal(false)}>Annuler</button>
              <button className="fd-mbtn-ok" onClick={addTypeOption} disabled={!defautTypeInput.trim()}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}