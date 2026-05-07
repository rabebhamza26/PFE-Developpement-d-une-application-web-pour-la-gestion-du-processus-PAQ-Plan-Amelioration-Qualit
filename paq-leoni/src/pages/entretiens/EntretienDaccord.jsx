// EntretienDaccord.jsx - Version corrigée pour QM_SEGMENT
import React, { useEffect, useState } from "react";
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
import { showErrorAlert, showInfoToast, showSuccessAlert, showSuccessToast } from "../../utils/entretienAlerts";

// Composant Modal Email (identique)
function EmailModal({ isOpen, onClose, onConfirm, emailsList, loadingEmails, action = "création" }) {
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
            <h3>Envoyer un email - {action === "création" ? "Création" : action === "modification" ? "Modification" : "Suppression"}</h3>
            <p>Choisissez le destinataire pour notifier de la {action === "suppression" ? "suppression" : action === "modification" ? "modification" : "création"} de l'entretien</p>
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
            {action === "suppression" ? "Confirmer la suppression" : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}

const buildDefaultForm = () => ({
  typeFaute: "",
  dateEntretien: new Date().toISOString().split("T")[0],
  validationMesures: false,
  mesuresProposees: "",
  commentaireQMSegment: "",
  echanges: "",
});

export default function EntretienDaccord({ niveau = 2 }) {
  const { matricule } = useParams();
  const navigate = useNavigate();

  // Récupérer le rôle de l'utilisateur connecté
  const [userRole, setUserRole] = useState(null);

  const [collaborator, setCollaborator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [resumeN1, setResumeN1] = useState(null);
  const [currentEntretienId, setCurrentEntretienId] = useState(null);
  const [entretiensList, setEntretiensList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [typeOptions, setTypeOptions] = useState([]);
  const [showDefautModal, setShowDefautModal] = useState(false);
  const [defautTypeInput, setDefautTypeInput] = useState("");
  const [emailsList, setEmailsList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [modalAction, setModalAction] = useState("création");

  const [formData, setFormData] = useState(buildDefaultForm());

  // Récupérer le rôle de l'utilisateur
  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
    }
  }, []);

  const loadEmails = async () => {
    try {
      setLoadingEmails(true);
      const response = await userService.getAllEmails();
      if (response && response.data && Array.isArray(response.data)) {
        console.log("Emails chargés:", response.data);
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
    loadEmails();
  }, [matricule]);

  useEffect(() => {
    if (!matricule) return;
    loadDraft();
  }, [matricule]);

  const resetForm = () => {
    setFormData(buildDefaultForm());
    setCurrentEntretienId(null);
    if (matricule) {
      localStorage.removeItem(`entretien-daccord-draft-${matricule}`);
    }
  };

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

      await loadAllEntretiens();

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

  const loadAllEntretiens = async () => {
    try {
      const res = await entretienDaccordService.getByMatricule(matricule);
      const list = Array.isArray(res.data) ? res.data : [];
      setEntretiensList(list);
      
      if (list.length > 0) {
        const dernier = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        chargerEntretienDansFormulaire(dernier);
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
      validationMesures: entretien.validationMesures === "Oui",
      mesuresProposees: entretien.mesuresProposees || "",
      commentaireQMSegment: entretien.commentaireQMSegment || "",
      echanges: entretien.echanges || "",
    });
    
    if (entretien.typeFaute && !typeOptions.includes(entretien.typeFaute)) {
      setTypeOptions(prev => [...prev, entretien.typeFaute]);
    }
    
    setStatusMessage("Entretien chargé avec succès.");
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(`entretien-daccord-draft-${matricule}`);
      if (!draft) return;
      const parsed = JSON.parse(draft);
      setFormData(prev => ({ ...prev, ...parsed }));
      if (parsed.id) setCurrentEntretienId(parsed.id);
    } catch (err) { console.warn("Brouillon non chargeable:", err); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAjouter = () => {
    resetForm();
    setStatusMessage("Formulaire réinitialisé.");
    showInfoToast("Formulaire r�initialis�");
  };

  const handleModifier = async () => {
    if (entretiensList.length === 0) {
      setError("Aucun entretien d'accord existant à modifier.");
      return;
    }
    const dernier = entretiensList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    chargerEntretienDansFormulaire(dernier);
    showInfoToast("Dernier entretien charg�");
  };

  const handleEnregistrer = () => {
    setSavingDraft(true);
    try {
      const payload = { ...formData, id: currentEntretienId };
      localStorage.setItem(`entretien-daccord-draft-${matricule}`, JSON.stringify(payload));
      setStatusMessage("Brouillon enregistré avec succès.");
      showSuccessToast("Brouillon enregistr�");
    } catch { setError("Impossible d'enregistrer le brouillon."); showErrorAlert("Brouillon non enregistr�", "Impossible d'enregistrer le brouillon."); }
    finally { setSavingDraft(false); }
  };

  const handleDeleteConfirm = async (destinataireEmail, message) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const nomCollab = collaborator ? `${collaborator.name} ${collaborator.prenom}` : matricule;
      
      await entretienDaccordService.deleteWithNotification(matricule, currentEntretienId, destinataireEmail, nomCollab);
      
      resetForm();
      await loadAllEntretiens();
      setStatusMessage("Entretien d'accord supprimé avec succès. Email envoyé.");
      await showSuccessAlert("Entretien supprim�", "L'entretien d'accord a bien �t� supprim�.");
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      setError("Erreur lors de la suppression : " + (err.response?.data?.message || err.message));
      console.error(err);
      showErrorAlert("Suppression impossible", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSupprimer = () => {
    if (!currentEntretienId) {
      setError("Aucun entretien chargé pour suppression.");
      return;
    }
    setModalAction("suppression");
    setShowEmailModal(true);
  };

  // ✅ Pour QM_SEGMENT: utiliser l'endpoint de validation au lieu de modification
  const handleSubmitConfirm = async (destinataireEmail, message) => {
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
        destinataireEmail: destinataireEmail,
      };

      // ✅ Si QM_SEGMENT et entretien existe déjà, utiliser l'endpoint de validation
      if (userRole === "QM_SEGMENT" && currentEntretienId) {
        await entretienDaccordService.valider(matricule, currentEntretienId, entretienData);
        setStatusMessage("Entretien d'accord validé avec succès. Email envoyé.");
        await showSuccessAlert("Entretien valid�", "La validation QM Segment a �t� enregistr�e.");
      } 
      // Sinon, modification ou création normale
      else if (currentEntretienId) {
        await entretienDaccordService.updateWithNotification(matricule, currentEntretienId, entretienData);
        setStatusMessage("Entretien d'accord modifié avec succès. Email envoyé.");
        await showSuccessAlert("Entretien modifi�", "La modification a �t� enregistr�e avec succ�s.");
      } else {
        await entretienDaccordService.create(matricule, entretienData);
        setStatusMessage("Entretien d'accord créé avec succès. Email envoyé.");
        await showSuccessAlert("Entretien cr��", "L'entretien d'accord a �t� cr�� avec succ�s.");
      }

      localStorage.removeItem(`entretien-daccord-draft-${matricule}`);
      await loadAllEntretiens();
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      console.error(err);
      setError("Erreur : " + (err.response?.data?.message || err.response?.data || err.message));
      showErrorAlert("Enregistrement impossible", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");

    // Déterminer l'action en fonction du rôle
    if (userRole === "QM_SEGMENT" && currentEntretienId) {
      setModalAction("validation");
    } else {
      setModalAction(currentEntretienId ? "modification" : "création");
    }
    setShowEmailModal(true);
  };

  const addTypeOption = async () => {
    const value = defautTypeInput.trim();
    if (!value) return;
    try {
      const res = await fauteService.create({ nom: value });
      const newFaute = res.data;
      setTypeOptions(prev => prev.includes(newFaute.nom) ? prev : [...prev, newFaute.nom]);
      setFormData(prev => ({ ...prev, typeFaute: newFaute.nom }));
      setDefautTypeInput(""); setShowDefautModal(false);
      setStatusMessage("Type de faute ajouté avec succès.");
      showSuccessToast("Faute ajout�e");
    } catch { setError("Erreur lors de l'ajout."); showErrorAlert("Ajout impossible", "Erreur lors de l'ajout du type de faute."); }
  };

  // Vérifier si l'utilisateur peut modifier (SL ou ADMIN)
  const canModify = userRole === "SL" || userRole === "ADMIN";
  // Vérifier si l'utilisateur peut valider (SL, QM_SEGMENT ou ADMIN)
  const canValidate = userRole === "SL" || userRole === "QM_SEGMENT" || userRole === "ADMIN";
  // Vérifier si l'utilisateur peut supprimer (SL ou ADMIN)
  const canDelete = userRole === "SL" || userRole === "ADMIN";

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
          {userRole === "QM_SEGMENT" && (
            <span className="leoni-badge-qm">Mode validation uniquement</span>
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
                    <label>Cause de faute:</label>
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
                    <button 
                      type="button" 
                      className="leoni-btn leoni-btn-warning leoni-btn-sm" 
                      onClick={() => setShowDefautModal(true)}
                      disabled={!canModify && userRole !== "QM_SEGMENT"}
                    >
                      + Ajouter faute
                    </button>
                    <div className="leoni-dropdown-container" style={{ flex: 1 }}>
                      <input
                        type="text"
                        className="leoni-input leoni-dropdown-input"
                        placeholder="Rechercher ou sélectionner une faute..."
                        value={formData.typeFaute}
                        onChange={e => { setFormData(p => ({ ...p, typeFaute: e.target.value })); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        disabled={!canModify && userRole !== "QM_SEGMENT"}
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
                    <input 
                      type="date" 
                      name="dateEntretien" 
                      value={formData.dateEntretien} 
                      onChange={handleChange} 
                      className="leoni-input" 
                      disabled={!canModify && userRole !== "QM_SEGMENT"}
                    />
                  </div>
                  <div className="leoni-form-group leoni-checkbox-group">
                    <label>Validation QM-Segment</label>
                    <input 
                      type="checkbox" 
                      name="validationMesures" 
                      checked={formData.validationMesures} 
                      onChange={handleChange} 
                      className="leoni-checkbox" 
                      disabled={!canValidate}
                    />
                  </div>
                </div>

                <div className="leoni-form-group">
                  <label>Mesures correctives proposées</label>
                  <textarea 
                    name="mesuresProposees" 
                    value={formData.mesuresProposees} 
                    onChange={handleChange} 
                    className="leoni-textarea" 
                    rows="3"
                    disabled={!canModify && userRole !== "QM_SEGMENT"}
                  />
                </div>

                <div className="leoni-form-group">
                  <label>Discussion SL / QM-Segment</label>
                  <textarea 
                    name="echanges" 
                    value={formData.echanges} 
                    onChange={handleChange} 
                    className="leoni-textarea" 
                    rows="3"
                    disabled={!canModify && userRole !== "QM_SEGMENT"}
                  />
                </div>

                <div className="leoni-form-group">
                  <label>Commentaires QM-Segment</label>
                  <textarea 
                    name="commentaireQMSegment" 
                    value={formData.commentaireQMSegment} 
                    onChange={handleChange} 
                    className="leoni-textarea" 
                    rows="3"
                  />
                </div>

                <div className="leoni-form-actions">
                  {/* Boutons visibles uniquement pour SL/ADMIN */}
                  {canModify && (
                    <>
                      <button type="button" className="leoni-btn leoni-btn-success" onClick={handleAjouter}>
                        Ajouter
                      </button>
                      <button type="button" className="leoni-btn leoni-btn-primary" onClick={handleModifier} disabled={loadingDraft}>
                        {loadingDraft ? "Chargement..." : "Modifier"}
                      </button>
                      <button type="button" className="leoni-btn leoni-btn-outline-dark" onClick={handleEnregistrer} disabled={savingDraft}>
                        {savingDraft ? "Enregistrement..." : "Brouillon"}
                      </button>
                    </>
                  )}
                  
                  {/* Bouton Valider visible pour SL, QM_SEGMENT et ADMIN */}
                  {canValidate && (
                    <button type="submit" className="leoni-btn leoni-btn-primary" disabled={saving}>
                      {saving ? "Validation..." : "Valider"}
                    </button>
                  )}
                  
                  {/* Bouton Supprimer visible uniquement pour SL/ADMIN */}
                  {canDelete && (
                    <button type="button" className="leoni-btn leoni-btn-danger" onClick={handleSupprimer}>
                      Supprimer
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onConfirm={handleSubmitConfirm}
        emailsList={emailsList}
        loadingEmails={loadingEmails}
        action={modalAction === "validation" ? "validation" : modalAction}
      />

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
                  className="leoni-input" placeholder="Saisir un nouveau type de faute" />
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

