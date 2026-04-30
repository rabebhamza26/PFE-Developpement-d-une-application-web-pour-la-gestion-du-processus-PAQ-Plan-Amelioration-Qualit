import React, { useState, useEffect, useRef } from "react";
import {
  collaboratorService,
  paqService,
  fauteService,
  entretienFinalService,
  entretienDecisionService,
  userService,
} from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";

import "../../styles/entretien-final.css";
import "../../styles/paq-dossier.css";

/* ─── Constantes ─────────────────────────────────────────── */
const DECISIONS = ["Licenciement", "Avertissement", "Formation", "Mutation", "Suspension"];

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

export default function EntretienFinal({ niveau = 5 }) {
  const { matricule } = useParams();
  const navigate      = useNavigate();
  const canvasRef     = useRef(null);

  const [typeOptions,       setTypeOptions]       = useState([]);
  const [showDefautModal,   setShowDefautModal]   = useState(false);
  const [defautTypeInput,   setDefautTypeInput]   = useState("");
  const [showDropdown,      setShowDropdown]      = useState(false);

  const [collaborator,      setCollaborator]      = useState(null);
  const [resumeN4,          setResumeN4]          = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [savingDraft,       setSavingDraft]       = useState(false);
  const [loadingDraft,      setLoadingDraft]      = useState(false);
  const [error,             setError]             = useState("");
  const [statusMessage,     setStatusMessage]     = useState("");
  const [isDrawing,         setIsDrawing]         = useState(false);
  const [signatureBase64,   setSignatureBase64]   = useState("");
  const [currentId,         setCurrentId]         = useState(null);

  // États pour le modal email
  const [emailsList, setEmailsList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [formData, setFormData] = useState({
    typeFaute:     "",
    dateEntretien: new Date().toISOString().split("T")[0],
    decision:      "",
    commentaireRH: "",
  });

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

  /* ── Chargement ─────────────────────────────────────────── */
  useEffect(() => {
    loadCollaborator();
    loadDraft();
    loadResumeN4();
    loadFautes();
    loadEmails();
  }, [matricule]);

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
      setTypeOptions(res.data.map(f => f.nom));
    } catch { setTypeOptions([]); }
  };

  const loadResumeN4 = async () => {
    try {
      const res = await entretienDecisionService.getEntretienDecisionByMatricule(matricule);
      const list = Array.isArray(res.data) ? res.data : [];
      setResumeN4(list.at(-1) || null);
    } catch { setResumeN4(null); }
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(`entretien-final-draft-${matricule}`);
      if (!draft) return;
      const parsed = JSON.parse(draft);
      setFormData(prev => ({ ...prev, ...parsed }));
      if (parsed.signatureBase64) {
        setSignatureBase64(parsed.signatureBase64);
        setTimeout(() => applySignatureToCanvas(parsed.signatureBase64), 200);
      }
      if (parsed.id) setCurrentId(parsed.id);
    } catch (err) { console.warn("Brouillon non chargeable:", err); }
  };

  const applySignatureToCanvas = (dataUrl) => {
    if (!dataUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const img    = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
    img.src    = dataUrl;
  };

  /* ── Canvas signature ────────────────────────────────────── */
  const getCanvasPoint = e => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = e => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath(); ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = e => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current; if (!canvas) return;
    setSignatureBase64(canvas.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setSignatureBase64("");
  };

  /* ── Handlers ────────────────────────────────────────────── */
  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const addTypeOption = async () => {
    const value = defautTypeInput.trim();
    if (!value) return;
    try {
      const res = await fauteService.create({ nom: value });
      const nom = res.data.nom;
      setTypeOptions(prev => prev.includes(nom) ? prev : [...prev, nom]);
      setFormData(prev => ({ ...prev, typeFaute: nom }));
      setDefautTypeInput("");
      setShowDefautModal(false);
    } catch { setError("Erreur ajout faute"); }
  };

  const handleEnregistrer = () => {
    setSavingDraft(true);
    try {
      const payload = { ...formData, signatureBase64, id: currentId };
      localStorage.setItem(`entretien-final-draft-${matricule}`, JSON.stringify(payload));
      setStatusMessage("Brouillon enregistré.");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch { setError("Impossible d'enregistrer le brouillon."); }
    finally { setSavingDraft(false); }
  };

  const handleAjouter = () => {
    setCurrentId(null);
    setFormData({ typeFaute:"", dateEntretien: new Date().toISOString().split("T")[0], decision:"", commentaireRH:"" });
    setSignatureBase64("");
    clearSignature();
    setStatusMessage("Formulaire réinitialisé.");
    localStorage.removeItem(`entretien-final-draft-${matricule}`);
  };

  const handleModifier = async () => {
    setLoadingDraft(true);
    try {
      const res  = await entretienFinalService.getByMatricule(matricule);
      const list = Array.isArray(res.data) ? res.data : [];
      const last = list.at(-1);
      if (!last) { setError("Aucun entretien final trouvé."); return; }
      setFormData({
        typeFaute:     last.typeFaute     || "",
        dateEntretien: last.dateEntretien || new Date().toISOString().split("T")[0],
        decision:      last.decision      || "",
        commentaireRH: last.commentaireRH || "",
      });
      setCurrentId(last.id);
      if (last.signatureBase64) {
        setSignatureBase64(last.signatureBase64);
        setTimeout(() => applySignatureToCanvas(last.signatureBase64), 100);
      }
      setStatusMessage("Dernier entretien chargé.");
    } catch { setError("Impossible de charger le dernier entretien."); }
    finally { setLoadingDraft(false); }
  };

  const handleSupprimer = async () => {
    if (!currentId) { setError("Aucun entretien chargé pour suppression."); return; }
    if (!window.confirm("Supprimer cet entretien ?")) return;
    try {
      await entretienFinalService.delete(currentId);
      setStatusMessage("Entretien supprimé.");
      setCurrentId(null);
      handleAjouter();
    } catch { setError("Erreur lors de la suppression."); }
  };

  // Confirmation email avant l'envoi
  const handleConfirmEmail = async (destinataireEmail, message) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const payload = {
        typeFaute:     formData.typeFaute,
        dateEntretien: formData.dateEntretien,
        decision:      formData.decision,
        commentaireRH: formData.commentaireRH,
        signatureBase64: signatureBase64.replace(/^data:image\/png;base64,/, ""),
        destinataireEmail: destinataireEmail,
      };

      await entretienFinalService.create(matricule, payload);

      localStorage.removeItem(`entretien-final-draft-${matricule}`);
      setStatusMessage("Entretien final validé, dossier clôturé et email envoyé ✓");
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Erreur lors de l'enregistrement");
    } finally { setSaving(false); }
  };

  // Ouvre le modal au lieu d'envoyer directement
  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setStatusMessage("");

    if (!formData.typeFaute)   return setError("Le type de faute est obligatoire !");
    if (!formData.decision)    return setError("La décision RH est obligatoire !");
    if (!signatureBase64)      return setError("La signature électronique est obligatoire !");

    // Ouvrir le modal pour choisir l'email
    setShowEmailModal(true);
  };

  const fmt = d => { if (!d) return "—"; try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; } };

  if (loading) return <div className="ef-loading">Chargement...</div>;

  return (
    <>
      <div className="ef-root">

        <div className="leoni-header">
          <div className="leoni-header-left">
            <button onClick={() => navigate(`/paq-dossier/${matricule}`)} className="leoni-btn-back">
              ← Retour au dossier
            </button>
          </div>
          <div className="leoni-header-title">
            <div className="leoni-logo-bar">
              <div className="leoni-logo-accent" />
              <h1>Entretien Final</h1>
            </div>
            {collaborator && (
              <span className="leoni-header-sub">
                {collaborator.name} {collaborator.prenom} — {collaborator.matricule}
              </span>
            )}
          </div>
          <div className="leoni-header-actions" />
        </div>

        <div className="ef-page">

          <aside className="ef-sidebar">
            <div className="ef-card">
              <div className="ef-card-hd">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Informations Collaborateur
              </div>
              <div className="ef-card-bd">
                <div className="ef-avatar">
                  {`${collaborator?.name?.[0]||""}${collaborator?.prenom?.[0]||""}`.toUpperCase() || "?"}
                </div>
                <div className="ef-cname">{collaborator?.name} {collaborator?.prenom}</div>
                <div className="ef-igrid">
                  <div className="ef-icell"><span className="ef-ilbl">Matricule</span><span className="ef-ival">{collaborator?.matricule||"–"}</span></div>
                  <div className="ef-icell"><span className="ef-ilbl">Segment</span><span className="ef-ival">{collaborator?.segment||"–"}</span></div>
                  <div className="ef-icell"><span className="ef-ilbl">Embauche</span><span className="ef-ival">{fmt(collaborator?.hireDate)}</span></div>
                  <div className="ef-icell"><span className="ef-ilbl">Statut</span><span className="ef-ival green">{collaborator?.status||"ACTIF"}</span></div>
                </div>
              </div>
            </div>

            <div className="ef-card">
              <div className="ef-card-hd amber">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Résumé — Entretien de Décision (N4)
              </div>
              <div className="ef-card-bd">
                {resumeN4 ? (
                  <div className="ef-rrow">
                    <div className="ef-rline"><span className="ef-rlbl">Type faute</span><span className="ef-rval">{resumeN4.typeFaute||"–"}</span></div>
                    <div className="ef-rline"><span className="ef-rlbl">Date</span><span className="ef-rval">{fmt(resumeN4.dateEntretien||resumeN4.date)}</span></div>
                    <div className="ef-rline"><span className="ef-rlbl">Décision</span><span className="ef-rval">{resumeN4.decision||"–"}</span></div>
                    {resumeN4.justification && (
                      <div className="ef-rline"><span className="ef-rlbl">Justif.</span><span className="ef-rval" style={{fontSize:11}}>{resumeN4.justification}</span></div>
                    )}
                  </div>
                ) : (
                  <div className="ef-rempty">Aucun entretien de décision trouvé</div>
                )}
              </div>
            </div>
          </aside>

          <div className="ef-main">

            {statusMessage && (
              <div className="ef-alert ef-alert-ok">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {statusMessage}
              </div>
            )}
            {error && (
              <div className="ef-alert ef-alert-err">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <div className="ef-form-card">
              <div className="leoni-card-header">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Formulaire
              </div>

              <div className="ef-form-bd">
                <form onSubmit={handleSubmit}>

                  <div className="ef-fg">
                    <label className="ef-lbl">Type de faute <span className="req">*</span></label>
                    <div className="ef-faute-row">
                      <div className="ef-dw">
                        <input type="text" className="ef-inp"
                          placeholder="Rechercher faute..."
                          value={formData.typeFaute}
                          onChange={e => { setFormData(p=>({...p,typeFaute:e.target.value})); setShowDropdown(true); }}
                          onFocus={() => setShowDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                        />
                        {showDropdown && typeOptions.length > 0 && (
                          <div className="ef-dlist">
                            {typeOptions
                              .filter(o => o.toLowerCase().includes(formData.typeFaute.toLowerCase()))
                              .map((o, i) => (
                                <div key={i} className="ef-ditem"
                                  onMouseDown={() => { setFormData(p=>({...p,typeFaute:o})); setShowDropdown(false); }}>
                                  {o}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      <button type="button" className="ef-btn-add" onClick={() => setShowDefautModal(true)}>
                        + Ajouter Faute
                      </button>
                    </div>
                  </div>

                  <div className="ef-row2">
                    <div className="ef-fg">
                      <label className="ef-lbl">Date entretien</label>
                      <input type="date" name="dateEntretien" className="ef-inp"
                        value={formData.dateEntretien} onChange={handleChange}/>
                    </div>
                    <div className="ef-fg">
                      <label className="ef-lbl">Décision RH <span className="req">*</span></label>
                      <select name="decision" className="ef-sel"
                        value={formData.decision} onChange={handleChange}>
                        <option value="">— Choisir —</option>
                        {DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="ef-fg">
                    <label className="ef-lbl">Commentaire RH</label>
                    <textarea name="commentaireRH" className="ef-ta" rows={3}
                      value={formData.commentaireRH} onChange={handleChange}
                      placeholder="Motivez la décision finale prise par les RH..."/>
                  </div>

                  <div className="ef-fg">
                    <div className="ef-sig-lbl">
                      Signature électronique
                      {signatureBase64 && <span className="ef-sig-ok">✓</span>}
                      <span style={{color:"#ef4444",marginLeft:2,fontSize:10}}>*</span>
                    </div>
                    <canvas
                      ref={canvasRef}
                      width={600} height={130}
                      className="ef-canvas"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                    <button type="button" className="ef-clr" onClick={clearSignature}>Effacer</button>
                  </div>

                  <div className="ef-actions">
                    <button type="button" className="ef-btn ef-btn-draft"
                      onClick={handleEnregistrer} disabled={savingDraft}>
                      {savingDraft ? "..." : "Enregistrer Brouillon"}
                    </button>
                    <button type="submit" className="ef-btn ef-btn-valider" disabled={saving}>
                      {saving ? "..." : "Valider"}
                    </button>
                    <button type="button" className="ef-btn ef-btn-ajouter" onClick={handleAjouter}>Ajouter</button>
                    <button type="button" className="ef-btn ef-btn-modifier"
                      onClick={handleModifier} disabled={loadingDraft}>
                      {loadingDraft ? "..." : "Modifier"}
                    </button>
                    <button type="button" className="ef-btn ef-btn-suppr" onClick={handleSupprimer}>Supprimer</button>
                  </div>

                </form>
              </div>
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
        <div className="ef-moverlay" onClick={() => setShowDefautModal(false)}>
          <div className="ef-modal" onClick={e => e.stopPropagation()}>
            <h3>Ajouter un type de faute</h3>
            <label className="ef-lbl">Nom du type de faute</label>
            <input className="ef-inp" style={{marginTop:6}} value={defautTypeInput}
              onChange={e => setDefautTypeInput(e.target.value)}
              placeholder="Ex : Ajouter Faute "
              onKeyDown={e => e.key === "Enter" && addTypeOption()}
              autoFocus/>
            <div className="ef-modal-acts">
              <button className="ef-mbtn-cancel" onClick={() => setShowDefautModal(false)}>Annuler</button>
              <button className="ef-mbtn-ok" onClick={addTypeOption} disabled={!defautTypeInput.trim()}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}