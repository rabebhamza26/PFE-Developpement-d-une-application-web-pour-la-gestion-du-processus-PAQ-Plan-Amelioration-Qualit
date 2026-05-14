// EntretienDaccord.jsx — SL valide → email QM_SEGMENT "Merci d'assister à l'entretien"
//                        QM_SEGMENT valide → pas d'email, historique PAQ mis à jour
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  collaboratorService,
  entretienDaccordService,
  entretienService,
  fauteService,
  userService,
} from "../../services/api";

import "../../styles/paq-dossier.css";
import "../../styles/entretien-explicatif.css";
import "../../styles/entretien-accord.css";
import {
  showErrorAlert,
  showInfoToast,
  showSuccessAlert,
  showSuccessToast,
} from "../../utils/entretienAlerts";

// ─────────────────────────────────────────────────────────────────────────────
// Modal Email — utilisé uniquement par SL (convocation QM_SEGMENT)
// ─────────────────────────────────────────────────────────────────────────────
function EmailModal({ isOpen, onClose, onConfirm, emailsList, loadingEmails }) {
  const [selectedEmail, setSelectedEmail] = useState("");

  useEffect(() => {
    if (isOpen) setSelectedEmail("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="leoni-modal-overlay" onClick={onClose}>
      <div
        className="leoni-modal"
        style={{ maxWidth: "500px" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="leoni-modal-header">
          <div className="leoni-modal-icon leoni-modal-icon-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                stroke="currentColor" strokeWidth="2"
              />
              <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h3>Envoyer la convocation — QM-Segment</h3>
            <p>Sélectionnez le QM-Segment à convoquer pour l'entretien d'accord</p>
          </div>
          <button className="leoni-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="leoni-modal-body">
          <div className="leoni-form-group">
            <label>Destinataire QM-Segment *</label>
            <select
              className="leoni-input"
              value={selectedEmail}
              onChange={e => setSelectedEmail(e.target.value)}
              disabled={loadingEmails}
            >
              <option value="">-- Sélectionnez un email --</option>
              {emailsList.map((email, idx) => (
                <option key={idx} value={email}>{email}</option>
              ))}
            </select>
            {loadingEmails && <small>Chargement des emails...</small>}
          </div>
        </div>

        <div className="leoni-modal-footer">
          <button type="button" className="leoni-btn leoni-btn-outline" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="leoni-btn leoni-btn-primary"
            onClick={() => onConfirm(selectedEmail)}
            disabled={!selectedEmail}
          >
            Valider &amp; Envoyer la convocation
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulaire par défaut
// ─────────────────────────────────────────────────────────────────────────────
const buildDefaultForm = () => ({
  typeFaute: "",
  dateEntretien: new Date().toISOString().split("T")[0],
  causeFaute: "",
  mesuresProposees: "",
  commentaireQMSegment: "",
});

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
export default function EntretienDaccord({ niveau = 2 }) {
  const { matricule } = useParams();
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState(null);
  const [collaborator, setCollaborator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [resumeN1, setResumeN1] = useState(null);
  const [currentEntretienId, setCurrentEntretienId] = useState(null);
  const [entretiensList, setEntretiensList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [typeOptions, setTypeOptions] = useState([]);
  const [showDefautModal, setShowDefautModal] = useState(false);
  const [defautTypeInput, setDefautTypeInput] = useState("");

  // Email modal — uniquement pour SL
  const [emailsList, setEmailsList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [validationStatus, setValidationStatus] = useState(false);
  const [formData, setFormData] = useState(buildDefaultForm());

  // ── Rôle utilisateur ──
  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
    }
  }, []);

  // ── Chargement emails QM_SEGMENT (uniquement utile pour SL) ──
  const loadQMEmails = async () => {
    try {
      setLoadingEmails(true);
      const response = await userService.getAllEmails();
      if (response?.data && Array.isArray(response.data)) {
        setEmailsList(response.data);
      } else {
        setEmailsList([]);
      }
    } catch (err) {
      console.error("Erreur chargement emails:", err);
      setEmailsList([]);
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    loadData();
    loadFautes();
    loadQMEmails();
  }, [matricule]);

  useEffect(() => {
    if (matricule) loadDraft();
  }, [matricule]);

  // ── Reset formulaire ──
  const resetForm = () => {
    setFormData(buildDefaultForm());
    setCurrentEntretienId(null);
    setValidationStatus(false);
    if (matricule) localStorage.removeItem(`entretien-daccord-draft-${matricule}`);
  };

  // ── Chargement fautes ──
  const loadFautes = async () => {
    try {
      const res = await fauteService.getAll();
      setTypeOptions(res.data.map(f => f.nom));
    } catch (err) {
      console.error("Erreur chargement fautes:", err);
    }
  };

  // ── Chargement données principal ──
  const loadData = async () => {
    try {
      setLoading(true);
      const collabRes = await collaboratorService.getById(matricule);
      setCollaborator(collabRes.data);

      try {
        const entretienExplicatifRes = await entretienService.getByMatricule(matricule);
        const liste = Array.isArray(entretienExplicatifRes.data) ? entretienExplicatifRes.data : [];
        if (liste.length > 0) {
          const dernier = liste.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )[0];
          setResumeN1({
            typeFaute: dernier.typeFaute || "–",
            dateFaute: dernier.dateFaute,
            causeFaute: dernier.description || "–",
            mesuresCorrectives: dernier.mesuresCorrectives || "–",
            commentaire: dernier.commentaire || "–",
          });
        } else {
          setResumeN1(null);
        }
      } catch {
        setResumeN1(null);
      }

      await loadAllEntretiens();
    } catch (err) {
      setError("Impossible de charger les informations.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Chargement liste entretiens ──
  const loadAllEntretiens = async () => {
    try {
      const res = await entretienDaccordService.getByMatricule(matricule);
      const list = Array.isArray(res.data) ? res.data : [];
      setEntretiensList(list);
      if (list.length > 0) {
        const dernier = list.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
        chargerEntretienDansFormulaire(dernier);
        setValidationStatus(dernier.valide || false);
      } else {
        resetForm();
      }
    } catch (err) {
      console.warn("Impossible de charger les entretiens d'accord:", err);
    }
  };

  const chargerEntretienDansFormulaire = (entretien) => {
    if (!entretien) return;
    setCurrentEntretienId(entretien.id);
    setFormData({
      typeFaute: entretien.typeFaute || "",
      dateEntretien: entretien.date || new Date().toISOString().split("T")[0],
      causeFaute: entretien.causeFaute || "",
      mesuresProposees: entretien.mesuresProposees || "",
      commentaireQMSegment: entretien.commentaireQMSegment || "",
    });
    if (entretien.typeFaute && !typeOptions.includes(entretien.typeFaute)) {
      setTypeOptions(prev => [...prev, entretien.typeFaute]);
    }
  };

  // ── Brouillon local ──
  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(`entretien-daccord-draft-${matricule}`);
      if (!draft) return;
      const parsed = JSON.parse(draft);
      setFormData(prev => ({ ...prev, ...parsed }));
      if (parsed.id) setCurrentEntretienId(parsed.id);
    } catch (err) {
      console.warn("Brouillon non chargeable:", err);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Bouton MODIFIER ──
  const handleModifier = async () => {
    if (!canModify) {
      showErrorAlert("Permission refusée", "Seuls les SL peuvent modifier un entretien.");
      return;
    }
    if (entretiensList.length === 0) {
      setError("Aucun entretien d'accord existant à modifier.");
      return;
    }
    const dernier = entretiensList.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];
    chargerEntretienDansFormulaire(dernier);
    showInfoToast("Dernier entretien chargé pour modification");
  };

  // ── Bouton BROUILLON ──
  const handleEnregistrer = () => {
    if (!canModify) {
      showErrorAlert("Permission refusée", "Seuls les SL peuvent enregistrer un brouillon.");
      return;
    }
    setSavingDraft(true);
    try {
      const payload = { ...formData, id: currentEntretienId };
      localStorage.setItem(
        `entretien-daccord-draft-${matricule}`,
        JSON.stringify(payload)
      );
      setStatusMessage("Brouillon enregistré avec succès.");
      showSuccessToast("Brouillon enregistré");
    } catch {
      setError("Impossible d'enregistrer le brouillon.");
      showErrorAlert("Brouillon non enregistré", "Impossible d'enregistrer le brouillon.");
    } finally {
      setSavingDraft(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // BOUTON VALIDER
  //   SL        → ouvre modal email → envoie convocation au QM_SEGMENT choisi
  //   QM_SEGMENT → validation directe sans email → historique PAQ mis à jour
  // ─────────────────────────────────────────────────────────────────────────
  const handleValider = () => {
    setError("");
    setStatusMessage("");

    if (!formData.typeFaute) {
      setError("Le type de faute est obligatoire");
      return;
    }

    if (userRole === "SL") {
      // SL → ouvre la modal pour choisir le QM_SEGMENT à convoquer
      setShowEmailModal(true);
    } else if (userRole === "QM_SEGMENT") {
      // QM_SEGMENT → validation directe, pas de modal email
      handleValidationQM();
    } else {
      showErrorAlert("Permission refusée", "Action non autorisée pour votre rôle.");
    }
  };

  // ── SL confirme l'email de convocation ──
  const handleConfirmEmailSL = async (destinataireEmail) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const entretienData = {
        typeFaute: formData.typeFaute,
        date: formData.dateEntretien,
        causeFaute: formData.causeFaute,
        mesuresProposees: formData.mesuresProposees || "",
        commentaireQMSegment: formData.commentaireQMSegment || "",
        destinataireEmail,
        message: "Merci d'assister à l'entretien d'accord",
      };

      if (currentEntretienId) {
        // Entretien existant : mise à jour + soumission pour validation
        await entretienDaccordService.validerPremiere(
          matricule,
          currentEntretienId,
          entretienData
        );
      } else {
        // Pas encore d'entretien : création
        await entretienDaccordService.create(matricule, entretienData);
      }

      setStatusMessage("Entretien soumis. Email de convocation envoyé au QM-Segment.");
      await showSuccessAlert(
        "Convocation envoyée",
        "L'email « Merci d'assister à l'entretien d'accord » a été envoyé au QM-Segment sélectionné."
      );

      localStorage.removeItem(`entretien-daccord-draft-${matricule}`);
      await loadAllEntretiens();
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data || err.message;
      setError("Erreur : " + msg);
      showErrorAlert("Enregistrement impossible", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── QM_SEGMENT valide directement (sans email) ──
  const handleValidationQM = async () => {
    setSaving(true);
    try {
      const entretienData = {
        typeFaute: formData.typeFaute,
        date: formData.dateEntretien,
        causeFaute: formData.causeFaute,
        mesuresProposees: formData.mesuresProposees || "",
        commentaireQMSegment: formData.commentaireQMSegment || "",
      };

      await entretienDaccordService.valider(
        matricule,
        currentEntretienId,
        entretienData
      );

      setValidationStatus(true);
      setStatusMessage("Entretien d'accord validé par QM-Segment. Le dossier PAQ a été mis à jour.");
      await showSuccessAlert(
        "Entretien validé",
        "La validation QM-Segment a été enregistrée dans le dossier PAQ."
      );

      localStorage.removeItem(`entretien-daccord-draft-${matricule}`);
      await loadAllEntretiens();
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data || err.message;
      setError("Erreur : " + msg);
      showErrorAlert("Validation impossible", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Ajout type de faute ──
  const addTypeOption = async () => {
    if (!canModify) {
      showErrorAlert("Permission refusée", "Seuls les SL peuvent ajouter un type de faute.");
      return;
    }
    const value = defautTypeInput.trim();
    if (!value) return;
    try {
      const res = await fauteService.create({ nom: value });
      const newFaute = res.data;
      setTypeOptions(prev =>
        prev.includes(newFaute.nom) ? prev : [...prev, newFaute.nom]
      );
      setFormData(prev => ({ ...prev, typeFaute: newFaute.nom }));
      setDefautTypeInput("");
      setShowDefautModal(false);
      showSuccessToast("Faute ajoutée");
    } catch {
      showErrorAlert("Ajout impossible", "Erreur lors de l'ajout du type de faute.");
    }
  };

  // ── Permissions ──
  const canModify   = userRole === "SL";
  const canValidate = (userRole === "SL") || (userRole === "QM_SEGMENT" && !!currentEntretienId);
  const isEditable  = userRole === "SL";

  const showModifier  = canModify && !!currentEntretienId;
  const showBrouillon = canModify;
  const showValider   = canValidate && !validationStatus;

  const getValiderLabel = () => {
    if (saving) return userRole === "QM_SEGMENT" ? "Validation..." : "Envoi...";
    if (userRole === "QM_SEGMENT") return "Valider (QM-Segment)";
    return "Valider & Convoquer QM-Segment";
  };

  const formatDate = dateStr => {
    if (!dateStr) return "–";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR");
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div className="leoni-loading">
        <div className="leoni-spinner"></div>
        <p>Chargement...</p>
      </div>
    );

  if (userRole === "ADMIN")
    return (
      <div className="leoni-shell">
        <div className="leoni-alert leoni-alert-error">
          Accès non autorisé. Les administrateurs ne peuvent pas accéder aux entretiens d'accord.
        </div>
        <button onClick={() => navigate("/dashboard")} className="leoni-btn leoni-btn-primary">
          Retour au tableau de bord
        </button>
      </div>
    );

  return (
    <div className="leoni-shell">
      {/* ── Header ── */}
      <div className="leoni-header">
        <div className="leoni-header-left">
          <button onClick={() => navigate(`/paq-dossier/${matricule}`)} className="leoni-btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour
          </button>
        </div>

        <div className="leoni-header-title">
          <div className="leoni-logo-bar">
            <div className="leoni-logo-accent"></div>
            <h1>Etape 2 : Entretien d'accord</h1>
          </div>
          {collaborator && (
            <span className="leoni-header-sub">
              {collaborator.name || ""} {collaborator.prenom || ""} —{" "}
              {collaborator.matricule || matricule}
            </span>
          )}

          {userRole === "SL" && currentEntretienId && !validationStatus && (
            <span className="leoni-badge-sl">📝 Mode modification & validation (SL)</span>
          )}
          {userRole === "SL" && !currentEntretienId && (
            <span className="leoni-badge-sl">📝 Mode création (SL)</span>
          )}
          {userRole === "QM_SEGMENT" && currentEntretienId && !validationStatus && (
            <span className="leoni-badge-qm">🔵 Mode validation finale (QM-Segment)</span>
          )}
          {userRole === "QM_SEGMENT" && !currentEntretienId && (
            <span className="leoni-badge-consult">👁️ Mode consultation (QM-Segment)</span>
          )}
          {(userRole === "SGL" ||
            (userRole !== "SL" && userRole !== "QM_SEGMENT" && userRole !== "ADMIN")) && (
            <span className="leoni-badge-consult">👁️ Mode consultation</span>
          )}
          {validationStatus && (
            <span className="leoni-badge-success">✅ Entretien validé par QM-Segment</span>
          )}
        </div>

        <div className="leoni-header-actions" />
      </div>

      {statusMessage && (
        <div className="leoni-alert leoni-alert-success">{statusMessage}</div>
      )}
      {error && (
        <div className="leoni-alert leoni-alert-error">{error}</div>
      )}

      <div className="leoni-grid-main">
        {/* ── Colonne gauche ── */}
        <div className="leoni-col-left">
          {collaborator && (
            <div className="leoni-card">
              <div className="leoni-card-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                    stroke="currentColor" strokeWidth="2" />
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
                    <span className="leoni-info-value leoni-mono">
                      {collaborator.matricule || "–"}
                    </span>
                  </div>
                  <div className="leoni-info-item">
                    <span className="leoni-info-label">Segment</span>
                    <span className="leoni-info-value">{collaborator.segment || "–"}</span>
                  </div>
                  <div className="leoni-info-item">
                    <span className="leoni-info-label">Date d'embauche</span>
                    <span className="leoni-info-value leoni-mono">
                      {formatDate(collaborator.hireDate)}
                    </span>
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
                <path
                  d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14.5z"
                  stroke="currentColor" strokeWidth="2"
                />
              </svg>
              Résumé — Entretien explicatif (N1)
            </div>
            <div className="leoni-card-body">
              {resumeN1 ? (
                <div className="leoni-form-stack">
                  <div className="leoni-form-group">
                    <label>Type faute :</label>
                    <p className="leoni-readonly">{resumeN1.typeFaute || "–"}</p>
                  </div>
                  <div className="leoni-form-group">
                    <label>Date :</label>
                    <p className="leoni-readonly">{formatDate(resumeN1.dateFaute)}</p>
                  </div>
                  <div className="leoni-form-group">
                    <label>Cause de faute :</label>
                    <p className="leoni-readonly">{resumeN1.causeFaute || "–"}</p>
                  </div>
                  <div className="leoni-form-group">
                    <label>Mesures correctives :</label>
                    <p className="leoni-readonly">{resumeN1.mesuresCorrectives || "–"}</p>
                  </div>
                  <div className="leoni-form-group">
                    <label>Commentaire :</label>
                    <p className="leoni-readonly">{resumeN1.commentaire || "–"}</p>
                  </div>
                </div>
              ) : (
                <p className="leoni-muted">Aucun entretien explicatif trouvé.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Colonne droite : Formulaire ── */}
        <div className="leoni-col-right">
          <div className="leoni-card">
            <div className="leoni-card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                  stroke="currentColor" strokeWidth="2" />
              </svg>
              Formulaire
            </div>
            <div className="leoni-card-body">
              <div className="leoni-form-stack">

                {/* Type de faute */}
                <div className="leoni-form-group">
                  <label>Type de faute *</label>
                  <div className="leoni-inline leoni-inline-reverse">
                    {isEditable && (
                      <button
                        type="button"
                        className="leoni-btn leoni-btn-warning leoni-btn-sm"
                        onClick={() => setShowDefautModal(true)}
                      >
                        + Ajouter faute
                      </button>
                    )}
                    <div className="leoni-dropdown-container" style={{ flex: 1 }}>
                      <input
                        type="text"
                        className="leoni-input leoni-dropdown-input"
                        placeholder="Rechercher ou sélectionner une faute..."
                        value={formData.typeFaute}
                        onChange={e => {
                          setFormData(p => ({ ...p, typeFaute: e.target.value }));
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        disabled={!isEditable}
                      />
                      {showDropdown && typeOptions.length > 0 && (
                        <ul className="leoni-dropdown-list">
                          {typeOptions
                            .filter(o =>
                              o.toLowerCase().includes(
                                (formData.typeFaute || "").toLowerCase()
                              )
                            )
                            .map((opt, i) => (
                              <li
                                key={i}
                                className="leoni-dropdown-item"
                                onMouseDown={() => {
                                  setFormData(p => ({ ...p, typeFaute: opt }));
                                  setShowDropdown(false);
                                }}
                              >
                                {opt}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date entretien */}
                <div className="leoni-form-group">
                  <label>Date entretien</label>
                  <input
                    type="date"
                    name="dateEntretien"
                    value={formData.dateEntretien}
                    onChange={handleChange}
                    className="leoni-input"
                    disabled={!isEditable}
                  />
                </div>

                {/* Cause de faute */}
                <div className="leoni-form-group">
                  <label>Cause de faute</label>
                  <textarea
                    name="causeFaute"
                    value={formData.causeFaute}
                    onChange={handleChange}
                    className="leoni-textarea"
                    rows="3"
                    disabled={!isEditable}
                  />
                </div>

                {/* Mesures correctives */}
                <div className="leoni-form-group">
                  <label>Mesures correctives proposées</label>
                  <textarea
                    name="mesuresProposees"
                    value={formData.mesuresProposees}
                    onChange={handleChange}
                    className="leoni-textarea"
                    rows="3"
                    disabled={!isEditable}
                  />
                </div>

                {/* Commentaire QM — éditable par QM_SEGMENT pour sa validation */}
                <div className="leoni-form-group">
                  <label>Commentaire </label>
                  <textarea
                    name="commentaireQMSegment"
                    value={formData.commentaireQMSegment}
                    onChange={handleChange}
                    className="leoni-textarea"
                    rows="3"
                    placeholder={
                      userRole === "QM_SEGMENT"
                        ? "Ajoutez votre commentaire avant de valider..."
                        : "Commentaire du QM-Segment..."
                    }
                    // QM_SEGMENT peut toujours saisir son commentaire
                    disabled={userRole !== "SL" && userRole !== "QM_SEGMENT"}
                  />
                </div>

                {/* ── Barre d'actions ── */}
                <div className="leoni-form-actions">

                  {/* Modifier : SL + entretien existant */}
                  {showModifier && (
                    <button
                      type="button"
                      className="leoni-btn leoni-btn-primary"
                      onClick={handleModifier}
                    >
                      Modifier
                    </button>
                  )}

                  {/* Brouillon : SL uniquement */}
                  {showBrouillon && (
                    <button
                      type="button"
                      className="leoni-btn leoni-btn-primary"
                      onClick={handleEnregistrer}
                      disabled={savingDraft}
                    >
                      {savingDraft ? "Enregistrement..." : "Brouillon"}
                    </button>
                  )}

                  {/*
                   * Valider :
                   *   SL        → ouvre modal email → convoque QM_SEGMENT
                   *   QM_SEGMENT → validation directe → met à jour historique PAQ
                   */}
                  {showValider && (
                    <button
                      type="button"
                      className="leoni-btn leoni-btn-success"
                      onClick={handleValider}
                      disabled={saving}
                    >
                      {getValiderLabel()}
                    </button>
                  )}

                  {!currentEntretienId && !canModify && userRole !== "QM_SEGMENT" && (
                    <div className="leoni-muted" style={{ padding: "8px 0" }}>
                      Aucun entretien d'accord trouvé pour ce collaborateur.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Email (SL uniquement) ── */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onConfirm={handleConfirmEmailSL}
        emailsList={emailsList}
        loadingEmails={loadingEmails}
      />

      {/* ── Modal Ajout faute ── */}
      {showDefautModal && (
        <div className="leoni-modal-overlay" onClick={() => setShowDefautModal(false)}>
          <div className="leoni-modal" onClick={e => e.stopPropagation()}>
            <div className="leoni-modal-header">
              <div className="leoni-modal-icon leoni-modal-icon-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
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
                  onChange={e => setDefautTypeInput(e.target.value)}
                  className="leoni-input"
                  placeholder="Saisir un nouveau type de faute"
                  onKeyDown={e => e.key === "Enter" && addTypeOption()}
                />
              </div>
            </div>
            <div className="leoni-modal-footer">
              <button
                type="button"
                className="leoni-btn leoni-btn-outline"
                onClick={() => setShowDefautModal(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="leoni-btn leoni-btn-warning"
                onClick={addTypeOption}
                disabled={!defautTypeInput.trim()}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
