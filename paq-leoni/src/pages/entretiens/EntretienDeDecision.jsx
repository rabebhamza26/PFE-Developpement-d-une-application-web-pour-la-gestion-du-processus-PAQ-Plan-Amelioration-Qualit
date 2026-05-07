import React, { useEffect, useState } from "react";
import {
  collaboratorService,
  entretienMesureService, 
  entretienDaccordService,
  entretienService, 
  entretienDecisionService,
  fauteService,
  userService,
} from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/entretien-decision.css";
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
            <h3>Envoyer un email - {action === "création" ? "Création" : action === "modification" ? "Modification" : action === "validation1" ? "Validation HP/SGL" : action === "validation2" ? "Validation QM-Plant" : "Suppression"}</h3>
            <p>Choisissez le destinataire pour notifier de la {action === "suppression" ? "suppression" : action === "modification" ? "modification" : action === "validation1" ? "validation HP/SGL" : action === "validation2" ? "validation QM-Plant" : "création"} de l'entretien</p>
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
  decision: "",
  justification: "",
});

export default function EntretienDeDecision({ niveau = 4 }) {
  const { matricule } = useParams();
  const navigate = useNavigate();

  // Récupérer le rôle de l'utilisateur
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);

  const [collaborator, setCollaborator] = useState(null);
  const [resumeN1, setResumeN1] = useState(null);
  const [resumeN2, setResumeN2] = useState(null);
  const [resumeN3, setResumeN3] = useState(null);
  const [entretiensList, setEntretiensList] = useState([]);
  const [currentEntretienId, setCurrentEntretienId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showDefautModal, setShowDefautModal] = useState(false);
  const [defautTypeInput, setDefautTypeInput] = useState("");
  const [typeOptions, setTypeOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
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
    if (!matricule) return;
    loadData();
    loadDraft();
    loadResumes();
    loadFautes();
    loadAllEntretiens();
    loadEmails();
  }, [matricule]);

  const resetForm = () => {
    setFormData(buildDefaultForm());
    setCurrentEntretienId(null);
    if (matricule) {
      localStorage.removeItem(`entretien-decision-draft-${matricule}`);
    }
  };

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
      if (parsed.id) setCurrentEntretienId(parsed.id);
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

  const loadAllEntretiens = async () => {
    try {
      const res = await entretienDecisionService.getByMatricule(matricule);
      const list = Array.isArray(res.data) ? res.data : [];
      setEntretiensList(list);
      
      if (list.length > 0) {
        const dernier = list.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))[0];
        chargerEntretienDansFormulaire(dernier);
      }
    } catch (err) {
      console.warn("Impossible de charger les entretiens de décision:", err);
    }
  };

  const chargerEntretienDansFormulaire = (entretien) => {
    if (!entretien) return;
    
    setCurrentEntretienId(entretien.id);
    setFormData({
      typeFaute: entretien.typeFaute || "",
      dateEntretien: entretien.dateEntretien || new Date().toISOString().split("T")[0],
      decision: entretien.decision || "",
      justification: entretien.justification || "",
    });
    
    if (entretien.typeFaute && !typeOptions.includes(entretien.typeFaute)) {
      setTypeOptions(prev => [...prev, entretien.typeFaute]);
    }
    
    setStatusMessage("Entretien chargé avec succès.");
    setTimeout(() => setStatusMessage(""), 3000);
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
      setStatusMessage("Type de faute ajouté avec succès.");
      showSuccessToast("Faute ajout�e");
    } catch { setError("Erreur ajout faute"); showErrorAlert("Ajout impossible", "Erreur lors de l'ajout du type de faute."); }
  };

  const handleEnregistrer = () => {
    setSavingDraft(true);
    try {
      const payload = { ...formData, id: currentEntretienId };
      localStorage.setItem(`entretien-decision-draft-${matricule}`, JSON.stringify(payload));
      setStatusMessage("Brouillon enregistré avec succès.");
      showSuccessToast("Brouillon enregistr�");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch { setError("Impossible d'enregistrer le brouillon."); showErrorAlert("Brouillon non enregistr�", "Impossible d'enregistrer le brouillon."); }
    finally { setSavingDraft(false); }
  };

  const handleAjouter = () => {
    resetForm();
    setStatusMessage("Nouveau formulaire prêt.");
    showInfoToast("Formulaire r�initialis�");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  const handleModifier = async () => {
    if (entretiensList.length === 0) {
      setError("Aucun entretien de décision existant à modifier.");
      return;
    }
    const dernier = entretiensList.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))[0];
    chargerEntretienDansFormulaire(dernier);
    showInfoToast("Dernier entretien charg�");
  };

  const handleDeleteConfirm = async (destinataireEmail, message) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const nomCollab = collaborator ? `${collaborator.name} ${collaborator.prenom}` : matricule;
      
      await entretienDecisionService.deleteWithNotification(matricule, currentEntretienId, destinataireEmail, nomCollab);
      
      resetForm();
      await loadAllEntretiens();
      setStatusMessage("Entretien de décision supprimé avec succès. Email envoyé.");
      await showSuccessAlert("Entretien supprim�", "L'entretien de d�cision a bien �t� supprim�.");
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      setError("Erreur lors de la suppression : " + (err.response?.data?.message || err.message));
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

  // Gestion des différentes actions selon le rôle
  const handleSubmitConfirm = async (destinataireEmail, message) => {
    setShowEmailModal(false);
    setSaving(true);

    try {
      const payload = { 
        ...formData, 
        destinataireEmail
      };

      // Cas 1: Validation HP ou SGL (1ère validation)
      if ((userRole === "HP" || userRole === "SGL") && currentEntretienId) {
        await entretienDecisionService.valider1(matricule, currentEntretienId, payload);
        setStatusMessage("Entretien de décision validé avec succès (1ère validation). Email envoyé.");
        await showSuccessAlert("Validation enregistr�e", "Premi�re validation effectu�e avec succ�s.");
      } 
      // Cas 2: Validation QM_Plant (2ème validation)
      else if (userRole === "QM_PLANT" && currentEntretienId) {
        await entretienDecisionService.valider2(matricule, currentEntretienId, payload);
        setStatusMessage("Entretien de décision validé avec succès (2ème validation). Email envoyé.");
        await showSuccessAlert("Validation enregistr�e", "Deuxi�me validation effectu�e avec succ�s.");
      }
      // Cas 3: Modification (SL seulement)
      else if (userRole === "SL" && currentEntretienId) {
        await entretienDecisionService.updateWithNotification(matricule, currentEntretienId, payload);
        setStatusMessage("Entretien de décision modifié avec succès. Email envoyé.");
        await showSuccessAlert("Entretien modifi�", "La modification a �t� enregistr�e avec succ�s.");
      }
      // Cas 4: Création (SL seulement)
      else if (userRole === "SL" && !currentEntretienId) {
        await entretienDecisionService.create(matricule, payload);
        setStatusMessage("Entretien de décision créé avec succès. Email envoyé.");
        await showSuccessAlert("Entretien cr��", "L'entretien de d�cision a �t� cr�� avec succ�s.");
      }
      // Cas 5: ADMIN peut tout faire
      else if (userRole === "ADMIN") {
        if (currentEntretienId) {
          await entretienDecisionService.updateWithNotification(matricule, currentEntretienId, payload);
          setStatusMessage("Entretien de décision modifié avec succès. Email envoyé.");
          await showSuccessAlert("Entretien modifi�", "La modification a �t� enregistr�e avec succ�s.");
        } else {
          await entretienDecisionService.create(matricule, payload);
          setStatusMessage("Entretien de décision créé avec succès. Email envoyé.");
          await showSuccessAlert("Entretien cr��", "L'entretien de d�cision a �t� cr�� avec succ�s.");
        }
      }
      else {
        setError(`Action non autorisée pour votre rôle: ${userRole}`);
        return;
      }
      
      localStorage.removeItem(`entretien-decision-draft-${matricule}`);
      await loadAllEntretiens();
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      console.error(err);
      setError("Erreur : " + (err.response?.data?.message || err.message));
      showErrorAlert("Enregistrement impossible", err.response?.data?.message || err.message);
    } finally { 
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setStatusMessage("");

    if (!formData.typeFaute) return setError("Veuillez sélectionner un type de faute.");
    if (!formData.decision) return setError("Veuillez saisir une décision.");

    // Déterminer l'action en fonction du rôle
    if ((userRole === "HP" || userRole === "SGL") && currentEntretienId) {
      setModalAction("validation1");
    } else if (userRole === "QM_PLANT" && currentEntretienId) {
      setModalAction("validation2");
    } else {
      setModalAction(currentEntretienId ? "modification" : "création");
    }
    setShowEmailModal(true);
  };

  // Permissions selon le rôle
  const canCreate = userRole === "SL" || userRole === "ADMIN";
  const canModify = userRole === "SL" || userRole === "ADMIN";
  const canDelete = userRole === "SL" || userRole === "ADMIN";
  const canValidate1 = (userRole === "HP" || userRole === "SGL") || userRole === "ADMIN";
  const canValidate2 = userRole === "QM_PLANT" || userRole === "ADMIN";
  
  // Déterminer si les champs sont modifiables
  const isEditable = () => {
    if (userRole === "ADMIN") return true;
    if (userRole === "SL") return true;
    return false;
  };

  // Afficher ou non le bouton Modifier
  const showModifyButton = () => {
    if (userRole === "ADMIN" && currentEntretienId) return true;
    if (userRole === "SL" && currentEntretienId) return true;
    return false;
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
          {userRole === "HP" && currentEntretienId && (
            <span className="leoni-badge-hp">🏷️ Mode validation HP (1ère)</span>
          )}
          {userRole === "SGL" && currentEntretienId && (
            <span className="leoni-badge-sgl">🏷️ Mode validation SGL (1ère)</span>
          )}
          {userRole === "QM_PLANT" && currentEntretienId && (
            <span className="leoni-badge-qm-plant">🏭 Mode validation QM-Plant (2ème)</span>
          )}
          {userRole === "SL" && !currentEntretienId && (
            <span className="leoni-badge-sl">📝 Mode création</span>
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
                      <input type="text" className="fd-inp" placeholder="Rechercher ou sélectionner une faute..."
                        value={formData.typeFaute}
                        onChange={e => { setFormData(p => ({...p, typeFaute: e.target.value})); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        disabled={!isEditable()}
                      />
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
                    <button 
                      type="button" 
                      className="fd-btn-add" 
                      onClick={() => setShowDefautModal(true)}
                      disabled={!isEditable()}
                    >
                      + Ajouter Faute
                    </button>
                  </div>
                </div>

                <div className="fd-row2">
                  <div className="fd-group">
                    <label className="fd-label">Date entretien</label>
                    <input 
                      type="date" 
                      name="dateEntretien" 
                      className="fd-inp" 
                      value={formData.dateEntretien} 
                      onChange={handleChange}
                      disabled={!isEditable()}
                    />
                  </div>
                  <div className="fd-group">
                    <label className="fd-label">Décision <span className="req">*</span></label>
                    <select 
                      name="decision" 
                      className="fd-sel" 
                      value={formData.decision} 
                      onChange={handleChange}
                      disabled={!isEditable() && userRole !== "HP" && userRole !== "SGL" && userRole !== "QM_PLANT"}
                    >
                      <option value="">— Choisir —</option>
                      <option>Avertissement</option>
                      <option>Formation</option>
                      <option>Mutation</option>
                      <option>Suspension</option>
                      <option>Licenciement</option>
                    </select>
                  </div>
                </div>

                <div className="fd-group">
                  <label className="fd-label">Justification</label>
                  <textarea 
                    name="justification" 
                    className="fd-ta" 
                    rows={3}
                    value={formData.justification} 
                    onChange={handleChange}
                    placeholder="Motivez la décision prise lors de cet entretien..."
                    disabled={!isEditable()}
                  />
                </div>

                <div className="fd-actions">
                  {/* Bouton Brouillon - visible pour SL et ADMIN */}
                  {(canCreate || canModify) && (
                    <button type="button" className="fd-btn fd-btn-draft" onClick={handleEnregistrer} disabled={savingDraft}>
                      {savingDraft ? "Enregistrement..." : "Enregistrer Brouillon"}
                    </button>
                  )}
                  
                  {/* Bouton Ajouter/Créer - visible pour SL et ADMIN */}
                  {canCreate && !currentEntretienId && (
                    <button type="button" className="fd-btn fd-btn-ajouter" onClick={handleAjouter}>
                      Ajouter
                    </button>
                  )}
                  
                  {/* Bouton Valider/Modifier/Créer principal */}
                  {canCreate && (
                    <button type="submit" className="fd-btn fd-btn-valider" disabled={saving}>
                      {saving ? "..." : (currentEntretienId ? "valider" : "Créer")}
                    </button>
                  )}
                  
                  {/* Bouton Validation 1ère - HP ou SGL */}
                  {canValidate1 && currentEntretienId && (userRole === "HP" || userRole === "SGL") && (
                    <button type="submit" className="fd-btn fd-btn-valider" disabled={saving}>
                      {saving ? "..." : "Valider (1ère validation)"}
                    </button>
                  )}
                  
                  {/* Bouton Validation 2ème - QM_Plant */}
                  {canValidate2 && currentEntretienId && userRole === "QM_PLANT" && (
                    <button type="submit" className="fd-btn fd-btn-valider" disabled={saving}>
                      {saving ? "..." : "Valider (2ème validation)"}
                    </button>
                  )}
                  
                  {/* Bouton Modifier séparé - UN SEUL pour SL et ADMIN */}
                  {showModifyButton() && (
                    <button type="button" className="fd-btn fd-btn-modifier" onClick={handleModifier} disabled={savingDraft}>
                      {savingDraft ? "..." : "Modifier"}
                    </button>
                  )}
                  
                  {/* Bouton Supprimer - SL ou ADMIN */}
                  {canDelete && currentEntretienId && (
                    <button type="button" className="fd-btn fd-btn-supprimer" onClick={handleSupprimer}>
                      Supprimer
                    </button>
                  )}
                  
                  {/* Bouton Annuler toujours visible */}
                  <button type="button" className="fd-btn fd-btn-annuler" onClick={() => navigate(`/paq-dossier/${matricule}`)}>
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onConfirm={modalAction === "suppression" ? handleDeleteConfirm : handleSubmitConfirm}
        emailsList={emailsList}
        loadingEmails={loadingEmails}
        action={modalAction}
      />

      {showDefautModal && (
        <div className="fd-moverlay" onClick={() => setShowDefautModal(false)}>
          <div className="fd-modal" onClick={e => e.stopPropagation()}>
            <h3>Ajouter un type de faute</h3>
            <label className="fd-label">Nom du type de faute</label>
            <input className="fd-inp" style={{marginTop:6}} value={defautTypeInput}
              onChange={e => setDefautTypeInput(e.target.value)} placeholder="Saisir un nouveau type de faute"
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

