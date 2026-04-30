import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  entretienMesureService,
  fauteService,
  collaboratorService,
  entretienDaccordService,
  userService,
} from "../../services/api";
import "../../styles/entretien-mesure.css";
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

export default function EntretienDeMesure({ niveau = 3 }) {
  const { matricule } = useParams();
  const navigate = useNavigate();

  const canvasSL  = useRef(null);
  const canvasQM  = useRef(null);
  const canvasSGL = useRef(null);

  const [typeOptions, setTypeOptions] = useState([]);
  const [showDefautModal, setShowDefautModal] = useState(false);
  const [defautTypeInput, setDefautTypeInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [collaborator, setCollaborator] = useState(null);
  const [niveau2Data, setNiveau2Data] = useState(null);

  // États pour le modal email
  const [emailsList, setEmailsList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const [formData, setFormData] = useState({
    typeFaute: "",
    dateEntretien: new Date().toISOString().split("T")[0],
    causesPrincipales: "",
    convention: "",
    planAction: "",
    dateRequalification: "",
  });

  const [signatureSL, setSignatureSL] = useState("");
  const [signatureQMSegment, setSignatureQMSegment] = useState("");
  const [signatureSGL, setSignatureSGL] = useState("");

  const [currentId, setCurrentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

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
    loadFautes();
    loadDraft();
    loadCollaborator();
    loadNiveau2();
    loadEmails();
  }, [matricule]);

  useEffect(() => {
    const t = setTimeout(() => {
      initCanvas(canvasSL, setSignatureSL);
      initCanvas(canvasQM, setSignatureQMSegment);
      initCanvas(canvasSGL, setSignatureSGL);
    }, 150);
    return () => clearTimeout(t);
  }, []);

  const loadCollaborator = async () => {
    try { const r = await collaboratorService.getById(matricule); setCollaborator(r.data); }
    catch (e) { console.error(e); }
  };

  const loadNiveau2 = async () => {
    try {
      const r = await entretienDaccordService.getByMatricule(matricule);
      setNiveau2Data((r.data || []).at(-1) || null);
    } catch { setNiveau2Data(null); }
  };

  const loadFautes = async () => {
    try { const r = await fauteService.getAll(); setTypeOptions(r.data.map(f => f.nom)); }
    catch { setTypeOptions([]); }
  };

  const loadDraft = () => {
    const raw = localStorage.getItem(`mesure-draft-${matricule}`);
    if (!raw) return;
    const p = JSON.parse(raw);
    setFormData(p);
    setSignatureSL(p.signatureSL || "");
    setSignatureQMSegment(p.signatureQMSegment || "");
    setSignatureSGL(p.signatureSGL || "");
    setCurrentId(p.id || null);
  };

  const initCanvas = (ref, setter) => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.strokeStyle = "#0f1f3d"; ctx.lineWidth = 2;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    let drawing = false;

    cv.onmousedown = e => { drawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); };
    cv.onmouseup = () => { drawing = false; setter(cv.toDataURL()); };
    cv.onmouseleave = () => { drawing = false; };
    cv.onmousemove = e => { if (!drawing) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); };
    cv.ontouchstart = e => {
      e.preventDefault(); drawing = true;
      const r = cv.getBoundingClientRect();
      ctx.beginPath(); ctx.moveTo(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
    };
    cv.ontouchend = () => { drawing = false; setter(cv.toDataURL()); };
    cv.ontouchmove = e => {
      e.preventDefault(); if (!drawing) return;
      const r = cv.getBoundingClientRect();
      ctx.lineTo(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); ctx.stroke();
    };
  };

  const clearCanvas = (ref, setter) => {
    const cv = ref.current;
    if (!cv) return;
    cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
    setter("");
  };

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSaveDraft = () => {
    setSavingDraft(true);
    localStorage.setItem(`mesure-draft-${matricule}`, JSON.stringify({
      ...formData, signatureSL, signatureQMSegment, signatureSGL, id: currentId,
    }));
    setStatus("Brouillon enregistré");
    setSavingDraft(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const handleAjouter = () => {
    setCurrentId(null);
    setFormData({
      typeFaute: "", dateEntretien: new Date().toISOString().split("T")[0],
      causesPrincipales: "", convention: "", planAction: "", dateRequalification: "",
    });
    setSignatureSL(""); setSignatureQMSegment(""); setSignatureSGL("");
    [canvasSL, canvasQM, canvasSGL].forEach(ref => {
      if (ref.current) ref.current.getContext("2d").clearRect(0, 0, ref.current.width, ref.current.height);
    });
    setStatus("Formulaire réinitialisé");
    setTimeout(() => setStatus(""), 2000);
  };

  const handleLoadLast = async () => {
    setLoadingDraft(true);
    try {
      const res = await entretienMesureService.getByMatricule(matricule);
      const last = res.data?.at(-1);
      if (!last) { setError("Aucun entretien trouvé"); return; }
      setFormData(last);
      setSignatureSL(last.signatureSL || "");
      setSignatureQMSegment(last.signatureQMSegment || "");
      setSignatureSGL(last.signatureSGL || "");
      setCurrentId(last.id);
      setStatus("Dernier entretien chargé");
    } catch { setError("Erreur lors du chargement"); }
    finally { setLoadingDraft(false); }
  };

  const handleDelete = async () => {
    if (!currentId || !window.confirm("Confirmer la suppression ?")) return;
    try {
      await entretienMesureService.delete(currentId);
      setStatus("Supprimé"); setCurrentId(null);
    } catch { setError("Erreur lors de la suppression"); }
  };

  const addTypeOption = async () => {
    if (!defautTypeInput.trim()) return;
    try {
      const res = await fauteService.create({ nom: defautTypeInput });
      const nom = res.data.nom;
      setTypeOptions(p => [...p, nom]);
      setFormData(p => ({ ...p, typeFaute: nom }));
      setShowDefautModal(false);
      setDefautTypeInput("");
    } catch { setError("Erreur lors de l'ajout du type de faute"); }
  };

  const getMaxDate = () => {
    if (!formData.dateEntretien) return "";
    const d = new Date(formData.dateEntretien);
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  };

  // MODIFIÉ : Confirmation email avant l'envoi
  const handleConfirmEmail = async (destinataireEmail, message) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const payload = { 
        ...formData, 
        signatureSL, 
        signatureQMSegment, 
        signatureSGL,
        destinataireEmail  // Ajout de l'email
      };

      if (currentId) {
        await entretienMesureService.update(currentId, payload);
      } else {
        const res = await entretienMesureService.create(matricule, payload);
        if (res.data?.id) setCurrentId(res.data.id);
      }
      
      localStorage.removeItem(`mesure-draft-${matricule}`);
      setStatus("Entretien de mesure enregistré et email envoyé ✓");
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Erreur lors de la sauvegarde";
      setError(typeof msg === "string" ? msg : "Erreur lors de la sauvegarde");
    } finally { 
      setSaving(false);
    }
  };

  // MODIFIÉ : Ouvre le modal au lieu d'envoyer directement
  const handleSubmit = async e => {
    e.preventDefault();
    if (saving) return;
    if (!formData.typeFaute) return setError("Le type de faute est obligatoire");
    if (!signatureSL || !signatureQMSegment || !signatureSGL)
      return setError("Toutes les signatures sont obligatoires");
    if (!formData.dateRequalification)
      return setError("La date de requalification est obligatoire");

    const de = new Date(formData.dateEntretien);
    const dr = new Date(formData.dateRequalification);
    const mx = new Date(de); mx.setDate(mx.getDate() + 7);
    if (dr > mx) return setError("La requalification doit être au maximum 7 jours après l'entretien");

    // Ouvrir le modal pour choisir l'email
    setShowEmailModal(true);
  };

  const fmt = d => { if (!d) return "–"; try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; } };

  return (
    <div className="em-root">

      <div className="leoni-header">
        <div className="leoni-header-left">
          <button onClick={() => navigate(`/paq-dossier/${matricule}`)} className="leoni-btn-back">
            ← Retour au dossier
          </button>
        </div>
        <div className="leoni-header-title">
          <div className="leoni-logo-bar">
            <div className="leoni-logo-accent" />
            <h1>Entretien de Mesure</h1>
          </div>
          {collaborator && (
            <span className="leoni-header-sub">
              {(collaborator.name || "").trim()} {(collaborator.prenom || "").trim()} — {collaborator.matricule || matricule}
            </span>
          )}
        </div>
        <div className="leoni-header-actions" />
      </div>

      <div className="em-layout">

        <aside>
          <div className="em-card">
            <div className="em-card-hd">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Informations Collaborateur
            </div>
            <div className="em-card-bd">
              <div className="em-grid-info">
                <div className="em-row-line">
                  <span className="em-label">Nom & Prenom</span>
                  <span className="em-value">{collaborator ? `${collaborator.name} ${collaborator.prenom}` : "—"}</span>
                </div>
                <div className="em-row-line">
                  <span className="em-label">Matricule</span>
                  <span className="em-value">{matricule}</span>
                </div>
                <div className="em-row-line">
                  <span className="em-label">Segment</span>
                  <span className="em-value">{collaborator?.segment || "–"}</span>
                </div>
                <div className="em-row-line">
                  <span className="em-label">Statut</span>
                  <span className="em-value status">{collaborator?.status || "ACTIF"}</span>
                </div>
                <div className="em-row-line">
                  <span className="em-label">Embauche</span>
                  <span className="em-value">{fmt(collaborator?.hireDate)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="em-card">
            <div className="em-card-hd amber">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Résumé — Entretien d'Accord (N2)
            </div>
            <div className="em-card-bd">
              {niveau2Data ? (
                <div className="em-grid-info">
                  <div className="em-row-line">
                    <span className="em-label">Type faute</span>
                    <span className="em-value">{niveau2Data.typeFaute || "–"}</span>
                  </div>
                  <div className="em-row-line">
                    <span className="em-label">Date</span>
                    <span className="em-value">{fmt(niveau2Data.date || niveau2Data.dateEntretien)}</span>
                  </div>
                  <div className="em-row-line">
                    <span className="em-label">Validation</span>
                    <span className="em-value" style={{ color: niveau2Data.validationMesures === "Oui" ? "var(--green)" : "var(--red)" }}>
                      {niveau2Data.validationMesures || "–"}
                    </span>
                  </div>
                  {niveau2Data.mesuresProposees && (
                    <div className="em-row-line">
                      <span className="em-label">Mesures</span>
                      <span className="em-value" style={{ fontSize: 12 }}>{niveau2Data.mesuresProposees}</span>
                    </div>
                  )}
                  {niveau2Data.echanges && (
                    <div className="em-row-line">
                      <span className="em-label">Échanges</span>
                      <span className="em-value" style={{ fontSize: 12 }}>{niveau2Data.echanges}</span>
                    </div>
                  )}
                  {niveau2Data.commentaireQMSegment && (
                    <div className="em-row-line">
                      <span className="em-label">Commentaire</span>
                      <span className="em-value" style={{ fontSize: 12 }}>{niveau2Data.commentaireQMSegment}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="em-n2-empty">Aucun entretien d'accord trouvé</div>
              )}
            </div>
          </div>
        </aside>

        <main>
          {error && (
            <div className="em-err">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}
          {status && (
            <div className="em-ok">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="em-section">
              <div className="leoni-card-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Formulaire
              </div>
              <div className="em-sec-bd">
                <div className="em-field">
                  <label className="em-lbl">Type de faute <span className="req">*</span></label>
                  <div className="em-frow">
                    <div className="em-dw">
                      <input type="text" className="em-inp"
                        placeholder="Rechercher ou saisir une faute..."
                        value={formData.typeFaute}
                        onChange={e => { setFormData(p => ({...p, typeFaute: e.target.value})); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      />
                      {showDropdown && typeOptions.length > 0 && (
                        <div className="em-dlist">
                          {typeOptions
                            .filter(o => o.toLowerCase().includes(formData.typeFaute.toLowerCase()))
                            .map((o, i) => (
                              <div key={i} className="em-ditem"
                                onMouseDown={() => { setFormData(p => ({...p, typeFaute: o})); setShowDropdown(false); }}>
                                {o}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <button type="button" className="em-btn-add-faute" onClick={() => setShowDefautModal(true)}>
                      + Ajouter Faute
                    </button>
                  </div>
                </div>

                <div className="em-row2">
                  <div className="em-field">
                    <label className="em-lbl">Date entretien <span className="req">*</span></label>
                    <input type="date" name="dateEntretien" className="em-inp"
                      value={formData.dateEntretien} onChange={handleChange}/>
                  </div>
                  <div className="em-field">
                    <label className="em-lbl">Date requalification <span className="req">*</span></label>
                    <input type="date" name="dateRequalification" className="em-inp"
                      value={formData.dateRequalification} onChange={handleChange}
                      min={formData.dateEntretien} max={getMaxDate()}/>
                    <span className="em-hint">Maximum 7 jours après l'entretien</span>
                  </div>
                </div>

                <div className="em-field">
                  <label className="em-lbl">Causes profondes</label>
                  <textarea name="causesPrincipales" className="em-ta" rows={3}
                    value={formData.causesPrincipales} onChange={handleChange}
                    placeholder="Décrivez les causes profondes identifiées..."/>
                </div>

                <div className="em-field">
                  <label className="em-lbl">Convention établie</label>
                  <textarea name="convention" className="em-ta" rows={3}
                    value={formData.convention} onChange={handleChange}
                    placeholder="Convention établie lors de l'entretien..."/>
                </div>

                <div className="em-field">
                  <label className="em-lbl">Plan d'action correctif</label>
                  <textarea name="planAction" className="em-ta" rows={3}
                    value={formData.planAction} onChange={handleChange}
                    placeholder="Actions correctives à mettre en place..."/>
                </div>

                <div className="em-sig3">
                  {[
                    {lbl:"Signature SL", ref:canvasSL, set:setSignatureSL, val:signatureSL},
                    {lbl:"Signature QM-Segment", ref:canvasQM, set:setSignatureQMSegment, val:signatureQMSegment},
                    {lbl:"Signature SGL", ref:canvasSGL, set:setSignatureSGL, val:signatureSGL},
                  ].map(({lbl, ref, set, val}) => (
                    <div key={lbl} className="em-sig-wrap">
                      <div className="em-sig-lbl">
                        {lbl}
                        {val && <span className="em-sig-ok">✓</span>}
                      </div>
                      <canvas ref={ref} width={260} height={90} className="em-canvas"/>
                      <button type="button" className="em-clear-sig" onClick={() => clearCanvas(ref, set)}>Effacer</button>
                    </div>
                  ))}
                </div>

                <div className="em-actions-bar">
                  <button type="button" className="em-btn em-btn-draft" onClick={handleSaveDraft} disabled={savingDraft}>
                    {savingDraft ? "Enregistrement..." : "Enregistrer Brouillon"}
                  </button>
                  <button type="submit" className="em-btn em-btn-valider" disabled={saving}>
                    {saving ? "..." : "Valider"}
                  </button>
                  <button type="button" className="em-btn em-btn-ajouter" onClick={handleAjouter}>Ajouter</button>
                  <button type="button" className="em-btn em-btn-modifier" onClick={handleLoadLast} disabled={loadingDraft}>
                    {loadingDraft ? "..." : "Modifier"}
                  </button>
                  <button type="button" className="em-btn em-btn-supprimer" onClick={handleDelete}>Supprimer</button>
                </div>
              </div>
            </div>
          </form>
        </main>
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
        <div className="em-moverlay" onClick={() => setShowDefautModal(false)}>
          <div className="em-modal" onClick={e => e.stopPropagation()}>
            <h3>Ajouter un type de faute</h3>
            <div style={{marginBottom:4}}>
              <label className="em-lbl">Nom du type de faute</label>
              <input className="em-inp" value={defautTypeInput}
                onChange={e => setDefautTypeInput(e.target.value)}
                placeholder="Ex : Nouvelle faute"
                onKeyDown={e => e.key === "Enter" && addTypeOption()}
                autoFocus/>
            </div>
            <div className="em-modal-act">
              <button className="em-btn-gh" onClick={() => setShowDefautModal(false)}>Annuler</button>
              <button className="em-btn-pr" onClick={addTypeOption} disabled={!defautTypeInput.trim()}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}