import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collaboratorService, entretienService } from "../../services/api";
import { fauteService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { showErrorAlert, showInfoToast, showSuccessAlert, showSuccessToast } from "../../utils/entretienAlerts";

import "../../styles/paq-dossier.css";
import "../../styles/entretien-explicatif.css";

// Composant Modal Email
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
            <label>Destinataire </label>
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
            {action === "suppression" ? "Confirmer la suppression" : "Envoyer"}
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
  const { user } = useAuth();
  const { isSL } = usePermissions();

  const [collaborator, setCollaborator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [currentEntretienId, setCurrentEntretienId] = useState(null);
  const [entretiensList, setEntretiensList] = useState([]);
  
  const [showDefautModal, setShowDefautModal] = useState(false);
  const [defautTypeInput, setDefautTypeInput] = useState("");
  const [typeOptions, setTypeOptions] = useState([]);

  const [formData, setFormData] = useState(buildDefaultForm());

  const [search, setSearch] = useState("");
  const [filteredFautes, setFilteredFautes] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [emailsList, setEmailsList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [modalAction, setModalAction] = useState("création");

  // Vérifier si l'utilisateur peut modifier (SL uniquement)
  const canModify = isSL ;

  const loadEmails = async () => {
    try {
      setLoadingEmails(true);
      const token = sessionStorage.getItem("access_token");
      
      if (!token) {
        console.warn("Pas de token, impossible de charger les emails");
        setEmailsList([]);
        return;
      }
      
      const response = await fetch('http://localhost:8083/api/users/emails', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const emails = await response.json();
        console.log("Emails chargés:", emails);
        setEmailsList(Array.isArray(emails) ? emails : []);
      } else {
        console.error("Erreur API:", response.status);
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
    const q = search.toLowerCase();
    const filtered = typeOptions.filter(f => f.toLowerCase().includes(q));
    setFilteredFautes(filtered);
  }, [search, typeOptions]);

  useEffect(() => {
    loadFautes();
    loadEmails();
  }, []);

  useEffect(() => {
    loadCollaborator();
    loadAllEntretiens();
  }, [matricule]);

  const resetForm = () => {
    setFormData(buildDefaultForm());
    setCurrentEntretienId(null);
    if (matricule) {
      localStorage.removeItem(`entretien-explicatif-draft-${matricule}`);
    }
  };

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

  const loadAllEntretiens = async () => {
    try {
      const res = await entretienService.getByMatricule(matricule);
      const list = Array.isArray(res.data) ? res.data : [];
      setEntretiensList(list);
      
      if (list.length > 0) {
        const dernier = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        chargerEntretienDansFormulaire(dernier);
      }
    } catch (err) {
      console.warn("Impossible de charger les entretiens:", err);
    }
  };

  const chargerEntretienDansFormulaire = (entretien) => {
    if (!entretien) return;
    
    setCurrentEntretienId(entretien.id);
    setFormData({
      typeFaute: entretien.typeFaute || "",
      dateFaute: entretien.dateFaute || new Date().toISOString().split("T")[0],
      description: entretien.description || "",
      mesuresCorrectives: entretien.mesuresCorrectives || "",
      commentaire: entretien.commentaire || "",
    });
    
    if (entretien.typeFaute && !typeOptions.includes(entretien.typeFaute)) {
      setTypeOptions(prev => [...prev, entretien.typeFaute]);
    }
    
    setStatusMessage("Entretien chargé avec succès.");
  };

  const handleChange = (e) => {
    if (!canModify) {
      showErrorAlert("Permission refusée", "Seuls les SL peuvent modifier un entretien.");
      return;
    }
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

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
      setTypeOptions((prev) => [...prev, newFaute.nom]);
      setFormData((prev) => ({ ...prev, typeFaute: newFaute.nom }));
      setDefautTypeInput("");
      setShowDefautModal(false);
      setStatusMessage("Type de défaut ajouté avec succès.");
      showSuccessToast("Faute ajoutée");
    } catch (err) {
      setError("Erreur lors de l'ajout du défaut.");
      showErrorAlert("Ajout impossible", "Erreur lors de l'ajout du défaut.");
    }
  };

  const handleModifier = async () => {
    if (!canModify) {
      showErrorAlert("Permission refusée", "Seuls les SL peuvent modifier un entretien.");
      return;
    }
    if (entretiensList.length === 0) {
      setError("Aucun entretien existant à modifier.");
      return;
    }
    const dernier = entretiensList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    chargerEntretienDansFormulaire(dernier);
    showInfoToast("Dernier entretien chargé");
  };

  const handleEnregistrer = () => {
    if (!canModify) {
      showErrorAlert("Permission refusée", "Seuls les SL peuvent enregistrer un brouillon.");
      return;
    }
    setSavingDraft(true);
    try {
      const payload = { ...formData };
      localStorage.setItem(`entretien-explicatif-draft-${matricule}`, JSON.stringify(payload));
      setStatusMessage("Brouillon enregistré avec succès.");
      showSuccessToast("Brouillon enregistré");
    } catch (err) {
      setError("Impossible d'enregistrer le brouillon.");
      showErrorAlert("Brouillon non enregistré", "Impossible d'enregistrer le brouillon.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitConfirm = async (destinataireEmail, message) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const entretienData = {
        notes: formData.commentaire || "",
        date: formData.dateFaute,
        typeFaute: formData.typeFaute,
        description: formData.description,
        mesuresCorrectives: formData.mesuresCorrectives,
        destinataireEmail: destinataireEmail,
      };

      if (currentEntretienId) {
        await entretienService.updateWithNotification(matricule, currentEntretienId, entretienData);
        setStatusMessage("Entretien modifié avec succès. Email envoyé.");
        await showSuccessAlert("Entretien modifié", "La modification a été enregistrée avec succès.");
      } else {
        await entretienService.create(matricule, entretienData);
        setStatusMessage("Entretien créé avec succès. Email envoyé.");
        await showSuccessAlert("Entretien créé", "L'entretien explicatif a été créé avec succès.");
      }

      localStorage.removeItem(`entretien-explicatif-draft-${matricule}`);
      await loadAllEntretiens();
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      setError("Erreur : " + (err.response?.data?.message || err.message));
      console.error(err);
      showErrorAlert("Enregistrement impossible", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");

    if (!canModify) {
      showErrorAlert("Permission refusée", "Seuls les SL peuvent créer ou modifier un entretien.");
      return;
    }

    setModalAction(currentEntretienId ? "modification" : "création");
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
            <h1>Etape1: Entretien Explication</h1>
          </div>
          {collaborator && (
            <span className="leoni-header-sub">
              {collaborator.name || ""} {collaborator.prenom || ""} — {collaborator.matricule || matricule}
            </span>
          )}
        </div>

        <div className="leoni-header-actions">
          {!canModify && (
            <span className="leoni-badge leoni-badge-gray">Mode lecture seule</span>
          )}
        </div>
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
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Formulaire
            </div>
            <div className="leoni-card-body">
              <form id="entretien-explicatif-form" onSubmit={handleSubmit} className="leoni-form-stack">
                <div className="leoni-form-group">
                  <label>Type de faute</label>
                  <div className="leoni-inline">
                    {canModify && (
                      <button type="button" onClick={() => setShowDefautModal(true)} className="leoni-btn leoni-btn-warning leoni-btn-sm">
                        + Ajouter faute
                      </button>
                    )}
                    <div className="leoni-dropdown-container" style={{ flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Rechercher ou sélectionner une faute"
                        value={formData.typeFaute}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, typeFaute: e.target.value }));
                          setSearch(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="leoni-input"
                        disabled={!canModify}
                      />
                      {showDropdown && (
                        <div className="leoni-dropdown">
                          {filteredFautes.length > 0 ? (
                            filteredFautes.map((f, index) => (
                              <div key={index} className="leoni-dropdown-item" onClick={() => {
                                setFormData(prev => ({ ...prev, typeFaute: f }));
                                setSearch(f);
                                setShowDropdown(false);
                              }}>
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

                <div className="leoni-form-group">
                  <label>Date de l'entretien</label>
                  <input type="date" name="dateFaute" value={formData.dateFaute} onChange={handleChange} className="leoni-input" disabled={!canModify} />
                </div>

                <div className="leoni-form-group">
                  <label>Cause de faute</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="leoni-textarea" rows="3" disabled={!canModify} />
                </div>

                <div className="leoni-form-group">
                  <label>Mesures correctives</label>
                  <textarea name="mesuresCorrectives" value={formData.mesuresCorrectives} onChange={handleChange} className="leoni-textarea" rows="3" disabled={!canModify} />
                </div>

                <div className="leoni-form-group">
                  <label>Commentaire</label>
                  <textarea name="commentaire" value={formData.commentaire} onChange={handleChange} className="leoni-textarea" rows="3" disabled={!canModify} />
                </div>

                <div className="leoni-form-actions">
                  {canModify && (
                    <>
                      <button type="button" onClick={handleModifier} className="leoni-btn leoni-btn-primary">
                        Modifier
                      </button>
                      <button type="button" onClick={handleEnregistrer} className="leoni-btn leoni-btn-outline-dark" disabled={savingDraft}>
                        {savingDraft ? "Enregistrement..." : "Brouillon"}
                      </button>
                      <button type="submit" className="leoni-btn leoni-btn-primary" disabled={saving}>
                        {saving ? "Validation..." : "Valider"}
                      </button>
                    </>
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
        action={modalAction}
      />

      {showDefautModal && (
        <div className="leoni-modal-overlay" onClick={() => setShowDefautModal(false)}>
          <div className="leoni-modal" onClick={(e) => e.stopPropagation()}>
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
                <input type="text" value={defautTypeInput} onChange={(e) => setDefautTypeInput(e.target.value)} className="leoni-input" placeholder="Saisir un nouveau type de faute" />
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