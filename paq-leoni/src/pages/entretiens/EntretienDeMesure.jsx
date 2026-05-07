// EntretienDeMesure.jsx - Version corrigée avec gestion des rôles
import React, { useEffect, useState } from "react";
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
import { showErrorAlert, showInfoToast, showSuccessAlert, showSuccessToast } from "../../utils/entretienAlerts";

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
            <h3>Envoyer un email - {action === "création" ? "Création" : action === "modification" ? "Modification" : action === "validation1" ? "Validation QM-Segment" : action === "validation2" ? "Validation SGL" : "Suppression"}</h3>
            <p>Choisissez le destinataire pour notifier de la {action === "suppression" ? "suppression" : action === "modification" ? "modification" : action === "validation1" ? "validation QM-Segment" : action === "validation2" ? "validation SGL" : "création"} de l'entretien</p>
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
  causesPrincipales: "",
  convention: "",
  planAction: "",
  dateRequalification: "",
});

export default function EntretienDeMesure({ niveau = 3 }) {
  const { matricule } = useParams();
  const navigate = useNavigate();

  // Récupérer le rôle de l'utilisateur
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);

  const [typeOptions, setTypeOptions] = useState([]);
  const [showDefautModal, setShowDefautModal] = useState(false);
  const [defautTypeInput, setDefautTypeInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [collaborator, setCollaborator] = useState(null);
  const [niveau2Data, setNiveau2Data] = useState(null);
  const [entretiensList, setEntretiensList] = useState([]);

  const [emailsList, setEmailsList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [modalAction, setModalAction] = useState("création");

  const [formData, setFormData] = useState(buildDefaultForm());
  const [currentId, setCurrentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // Récupérer le rôle de l'utilisateur
  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
      setUserPermissions(user.permissions || []);
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
    loadFautes();
    loadDraft();
    loadCollaborator();
    loadNiveau2();
    loadAllEntretiens();
    loadEmails();
  }, [matricule]);

  const resetForm = () => {
    setFormData(buildDefaultForm());
    setCurrentId(null);
    if (matricule) {
      localStorage.removeItem(`mesure-draft-${matricule}`);
    }
  };

  const loadCollaborator = async () => {
    try { 
      const r = await collaboratorService.getById(matricule); 
      setCollaborator(r.data); 
    } catch (e) { console.error(e); }
  };

  const loadNiveau2 = async () => {
    try {
      const r = await entretienDaccordService.getByMatricule(matricule);
      setNiveau2Data((r.data || []).at(-1) || null);
    } catch { setNiveau2Data(null); }
  };

  const loadFautes = async () => {
    try { 
      const r = await fauteService.getAll(); 
      setTypeOptions(r.data.map(f => f.nom)); 
    } catch { setTypeOptions([]); }
  };

  const loadAllEntretiens = async () => {
    try {
      const res = await entretienMesureService.getByMatricule(matricule);
      const list = Array.isArray(res.data) ? res.data : [];
      setEntretiensList(list);
      
      if (list.length > 0) {
        const dernier = list.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))[0];
        chargerEntretienDansFormulaire(dernier);
      }
    } catch (err) {
      console.warn("Impossible de charger les entretiens de mesure:", err);
    }
  };

  const chargerEntretienDansFormulaire = (entretien) => {
    if (!entretien) return;
    
    setCurrentId(entretien.id);
    setFormData({
      typeFaute: entretien.typeFaute || "",
      dateEntretien: entretien.dateEntretien || new Date().toISOString().split("T")[0],
      causesPrincipales: entretien.causesPrincipales || "",
      convention: entretien.convention || "",
      planAction: entretien.planAction || "",
      dateRequalification: entretien.dateRequalification || "",
    });
    
    if (entretien.typeFaute && !typeOptions.includes(entretien.typeFaute)) {
      setTypeOptions(prev => [...prev, entretien.typeFaute]);
    }
    
    setStatus("Entretien chargé avec succès.");
    setTimeout(() => setStatus(""), 3000);
  };

  const loadDraft = () => {
    const raw = localStorage.getItem(`mesure-draft-${matricule}`);
    if (!raw) return;
    const p = JSON.parse(raw);
    setFormData(p);
    setCurrentId(p.id || null);
  };

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSaveDraft = () => {
    setSavingDraft(true);
    localStorage.setItem(`mesure-draft-${matricule}`, JSON.stringify({ ...formData, id: currentId }));
    setStatus("Brouillon enregistré");
    setSavingDraft(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const handleAjouter = () => {
    resetForm();
    setStatus("Formulaire réinitialisé");
    setTimeout(() => setStatus(""), 2000);
  };

  const handleModifier = async () => {
    if (entretiensList.length === 0) {
      setError("Aucun entretien de mesure existant à modifier.");
      return;
    }
    const dernier = entretiensList.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))[0];
    chargerEntretienDansFormulaire(dernier);
    showInfoToast("Dernier entretien chargé");
  };

  const handleDeleteConfirm = async (destinataireEmail, message) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const nomCollab = collaborator ? `${collaborator.name} ${collaborator.prenom}` : matricule;
      
      await entretienMesureService.deleteWithNotification(matricule, currentId, destinataireEmail, nomCollab);
      
      resetForm();
      await loadAllEntretiens();
      setStatus("Entretien de mesure supprimé avec succès. Email envoyé.");
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      setError("Erreur lors de la suppression : " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSupprimer = () => {
    if (!currentId) {
      setError("Aucun entretien chargé pour suppression.");
      return;
    }
    setModalAction("suppression");
    setShowEmailModal(true);
  };

  // ✅ Gestion des différentes actions selon le rôle
  const handleSubmitConfirm = async (destinataireEmail, message) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const payload = { 
        ...formData, 
        destinataireEmail
      };

      // ✅ Cas 1: Validation QM_SEGMENT (1ère validation)
      if (userRole === "QM_SEGMENT" && currentId) {
        await entretienMesureService.valider1(matricule, currentId, payload);
        setStatus("Entretien de mesure validé avec succès (QM-Segment). Email envoyé.");
      } 
      // ✅ Cas 2: Validation SGL (2ème validation)
      else if (userRole === "SGL" && currentId) {
        await entretienMesureService.valider2(matricule, currentId, payload);
        setStatus("Entretien de mesure validé avec succès (SGL). Email envoyé.");
      }
      // ✅ Cas 3: Modification (SGL seulement)
      else if (userRole === "SGL" && currentId) {
        await entretienMesureService.updateWithNotification(matricule, currentId, payload);
        setStatus("Entretien de mesure modifié avec succès. Email envoyé.");
      }
      // ✅ Cas 4: Création (SL seulement)
      else if (userRole === "SL" && !currentId) {
        await entretienMesureService.create(matricule, payload);
        setStatus("Entretien de mesure créé avec succès. Email envoyé.");
      }
      // ✅ Cas 5: ADMIN peut tout faire
      else if (userRole === "ADMIN") {
        if (currentId) {
          await entretienMesureService.updateWithNotification(matricule, currentId, payload);
          setStatus("Entretien de mesure modifié avec succès. Email envoyé.");
        } else {
          await entretienMesureService.create(matricule, payload);
          setStatus("Entretien de mesure créé avec succès. Email envoyé.");
        }
      }
      else {
        setError("Action non autorisée pour votre rôle.");
        return;
      }
      
      localStorage.removeItem(`mesure-draft-${matricule}`);
      await loadAllEntretiens();
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Erreur lors de la sauvegarde";
      setError(typeof msg === "string" ? msg : "Erreur lors de la sauvegarde");
      console.error("Erreur détaillée:", err);
    } finally { 
      setSaving(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!formData.typeFaute) return setError("Le type de faute est obligatoire");
    if (!formData.dateRequalification) return setError("La date de requalification est obligatoire");

    const de = new Date(formData.dateEntretien);
    const dr = new Date(formData.dateRequalification);
    const mx = new Date(de); mx.setDate(mx.getDate() + 7);
    if (dr > mx) return setError("La requalification doit être au maximum 7 jours après l'entretien");

    // Déterminer l'action en fonction du rôle
    if (userRole === "QM_SEGMENT" && currentId) {
      setModalAction("validation1");
    } else if (userRole === "SGL" && currentId) {
      setModalAction("validation2");
    } else {
      setModalAction(currentId ? "modification" : "création");
    }
    setShowEmailModal(true);
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
      setStatus("Type de faute ajouté avec succès");
    } catch { setError("Erreur lors de l'ajout du type de faute"); }
  };

  const getMaxDate = () => {
    if (!formData.dateEntretien) return "";
    const d = new Date(formData.dateEntretien);
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  };

  // ✅ Permissions selon le rôle
  const canCreate = userRole === "SL" || userRole === "ADMIN";
  const canModify = userRole === "SGL" || userRole === "ADMIN";
  const canValidate1 = userRole === "QM_SEGMENT" || userRole === "ADMIN";
  const canValidate2 = userRole === "SGL" || userRole === "ADMIN";
  const canDelete = userRole === "SGL" || userRole === "ADMIN";
  
  // Déterminer si les champs sont modifiables
  const isEditable = () => {
    if (userRole === "ADMIN") return true;
    if (userRole === "SL" && !currentId) return true; // SL peut créer
    if (userRole === "SGL" && currentId) return true; // SGL peut modifier
    return false;
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
          {userRole === "QM_SEGMENT" && currentId && (
            <span className="leoni-badge-qm">🔵 Mode validation QM-Segment</span>
          )}
          {userRole === "SGL" && currentId && (
            <span className="leoni-badge-sgl">🟢 Mode validation SGL / Modification</span>
          )}
          {userRole === "SL" && !currentId && (
            <span className="leoni-badge-sl">📝 Mode création</span>
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
                        placeholder="Rechercher ou sélectionner une faute..."
                        value={formData.typeFaute}
                        onChange={e => { setFormData(p => ({...p, typeFaute: e.target.value})); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        disabled={!isEditable()}
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
                    <button 
                      type="button" 
                      className="em-btn-add-faute" 
                      onClick={() => setShowDefautModal(true)}
                      disabled={!isEditable()}
                    >
                      + Ajouter Faute
                    </button>
                  </div>
                </div>

                <div className="em-row2">
                  <div className="em-field">
                    <label className="em-lbl">Date entretien <span className="req">*</span></label>
                    <input 
                      type="date" 
                      name="dateEntretien" 
                      className="em-inp"
                      value={formData.dateEntretien} 
                      onChange={handleChange}
                      disabled={!isEditable()}
                    />
                  </div>
                  <div className="em-field">
                    <label className="em-lbl">Date requalification <span className="req">*</span></label>
                    <input 
                      type="date" 
                      name="dateRequalification" 
                      className="em-inp"
                      value={formData.dateRequalification} 
                      onChange={handleChange}
                      min={formData.dateEntretien} 
                      max={getMaxDate()}
                      disabled={!isEditable()}
                    />
                    <span className="em-hint">Maximum 7 jours après l'entretien</span>
                  </div>
                </div>

                <div className="em-field">
                  <label className="em-lbl">Causes profondes</label>
                  <textarea 
                    name="causesPrincipales" 
                    className="em-ta" 
                    rows={3}
                    value={formData.causesPrincipales} 
                    onChange={handleChange}
                    placeholder="Décrivez les causes profondes identifiées..."
                    disabled={!isEditable() && userRole !== "QM_SEGMENT" && userRole !== "SGL"}
                  />
                </div>

                <div className="em-field">
                  <label className="em-lbl">Convention établie</label>
                  <textarea 
                    name="convention" 
                    className="em-ta" 
                    rows={3}
                    value={formData.convention} 
                    onChange={handleChange}
                    placeholder="Convention établie lors de l'entretien..."
                    disabled={!isEditable() && userRole !== "QM_SEGMENT" && userRole !== "SGL"}
                  />
                </div>

                <div className="em-field">
                  <label className="em-lbl">Plan d'action correctif</label>
                  <textarea 
                    name="planAction" 
                    className="em-ta" 
                    rows={3}
                    value={formData.planAction} 
                    onChange={handleChange}
                    placeholder="Actions correctives à mettre en place..."
                    disabled={!isEditable() && userRole !== "QM_SEGMENT" && userRole !== "SGL"}
                  />
                </div>

                <div className="em-actions-bar">
                  {/* Création - visible pour SL et ADMIN */}
                  {canCreate && !currentId && (
                    <button type="button" className="em-btn em-btn-ajouter" onClick={handleAjouter}>
                      Ajouter
                    </button>
                  )}
                  
                  {/* Modification - visible pour SGL et ADMIN */}
                  {canModify && currentId && (
                    <button type="button" className="em-btn em-btn-modifier" onClick={handleModifier} disabled={loadingDraft}>
                      {loadingDraft ? "..." : "Modifier"}
                    </button>
                  )}
                  
                  {/* Brouillon - visible pour SL et ADMIN en création, SGL en modification */}
                  {(canCreate || canModify) && (
                    <button type="button" className="em-btn em-btn-draft" onClick={handleSaveDraft} disabled={savingDraft}>
                      {savingDraft ? "Enregistrement..." : "Enregistrer Brouillon"}
                    </button>
                  )}
                  
                  {/* Validation - QM_SEGMENT pour valider1, SGL pour valider2 */}
                  {canValidate1 && currentId && userRole === "QM_SEGMENT" && (
                    <button type="submit" className="em-btn em-btn-valider" disabled={saving}>
                      {saving ? "..." : "Valider (QM-Segment)"}
                    </button>
                  )}
                  
                  {canValidate2 && currentId && userRole === "SGL" && (
                    <button type="submit" className="em-btn em-btn-valider" disabled={saving}>
                      {saving ? "..." : "Valider (SGL)"}
                    </button>
                  )}
                  
                  {/* Création initiale pour SL */}
                  {canCreate && !currentId && (
                    <button type="submit" className="em-btn em-btn-valider" disabled={saving}>
                      {saving ? "..." : "Créer"}
                    </button>
                  )}
                  
                  {/* ADMIN peut tout faire */}
                  {userRole === "ADMIN" && (
                    <button type="submit" className="em-btn em-btn-valider" disabled={saving}>
                      {saving ? "..." : (currentId ? "Modifier" : "Créer")}
                    </button>
                  )}
                  
                  {/* Suppression - visible pour SGL et ADMIN */}
                  {canDelete && currentId && (
                    <button type="button" className="em-btn em-btn-supprimer" onClick={handleSupprimer}>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </main>
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