// EntretienDeDecision.jsx - Version corrigée

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

// Composant Modal Email pour sélection multiple avec filtres par rôle
function EmailModal({ isOpen, onClose, onConfirm, usersList, loadingUsers, action = "création" }) {
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [message, setMessage] = useState("");
  const [emailFilter, setEmailFilter] = useState("all");

  // Réinitialiser la sélection quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSelectedEmails([]);
      setMessage("");
      setEmailFilter("all");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isValidationSLAction = action === "validationSL";

  const getFilteredUsers = () => {
    if (emailFilter === "all") {
      return usersList;
    }
    return usersList.filter(user => user.role === emailFilter);
  };

  const toggleEmailSelection = (email) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const toggleAllEmails = () => {
    const filteredUsers = getFilteredUsers();
    const allEmailsInList = filteredUsers.map(u => u.email);
    if (selectedEmails.length === allEmailsInList.length && allEmailsInList.length > 0) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(allEmailsInList);
    }
  };

  const handleConfirm = () => {
    if (selectedEmails.length === 0) {
      showErrorAlert("Email requis", "Veuillez sélectionner au moins un destinataire");
      return;
    }
    
    if (isValidationSLAction) {
      onConfirm(selectedEmails, message);
    } else if (action === "suppression") {
      onConfirm(selectedEmails[0], message);
    } else {
      onConfirm(selectedEmails, message);
    }
  };

  const filteredUsers = getFilteredUsers();
  const allSelected = filteredUsers.length > 0 && selectedEmails.length === filteredUsers.length;

  return (
    <div className="leoni-modal-overlay" onClick={onClose}>
      <div className="leoni-modal" style={{ maxWidth: "650px", maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
        <div className="leoni-modal-header">
          <div className="leoni-modal-icon leoni-modal-icon-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
              <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <h3>Envoyer un email - {action === "validationSL" ? "Validation SL" : action === "suppression" ? "Suppression" : action === "modification" ? "Modification" : "Création"}</h3>
            <p>
              {isValidationSLAction 
                ? "Sélectionnez les destinataires (HP, SGL, QM_PLANT) pour la convocation"
                : action === "suppression"
                ? "Choisissez le destinataire pour notifier de la suppression"
                : "Sélectionnez les destinataires pour notifier"}
            </p>
          </div>
          <button className="leoni-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="leoni-modal-body">
          {usersList.length > 0 && (
            <div style={{ marginBottom: 16, display: "flex", gap: "10px", flexWrap: "wrap", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <button
                type="button"
                onClick={() => setEmailFilter("all")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "1px solid #C8102E",
                  background: emailFilter === "all" ? "#C8102E" : "white",
                  color: emailFilter === "all" ? "white" : "#C8102E",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Tous ({usersList.length})
              </button>
              <button
                type="button"
                onClick={() => setEmailFilter("HP")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "1px solid #C8102E",
                  background: emailFilter === "HP" ? "#C8102E" : "white",
                  color: emailFilter === "HP" ? "white" : "#C8102E",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                HP ({usersList.filter(u => u.role === "HP").length})
              </button>
              <button
                type="button"
                onClick={() => setEmailFilter("SGL")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "1px solid #C8102E",
                  background: emailFilter === "SGL" ? "#C8102E" : "white",
                  color: emailFilter === "SGL" ? "white" : "#C8102E",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                SGL ({usersList.filter(u => u.role === "SGL").length})
              </button>
              <button
                type="button"
                onClick={() => setEmailFilter("QM_PLANT")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "1px solid #C8102E",
                  background: emailFilter === "QM_PLANT" ? "#C8102E" : "white",
                  color: emailFilter === "QM_PLANT" ? "white" : "#C8102E",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                QM_PLANT ({usersList.filter(u => u.role === "QM_PLANT").length})
              </button>
            </div>
          )}

          <div style={{ marginBottom: 20, border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ 
              padding: "12px", 
              background: "#f8f9fa", 
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAllEmails}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <strong style={{ flex: 1 }}>Sélectionner tous les {filteredUsers.length} utilisateur(s)</strong>
              <span style={{ fontSize: "12px", color: "#666" }}>
                {selectedEmails.length} sélectionné(s)
              </span>
            </div>
            <div style={{ maxHeight: "300px", overflow: "auto" }}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      background: selectedEmails.includes(user.email) ? "#f0f9ff" : "white",
                      cursor: "pointer"
                    }}
                    onClick={() => toggleEmailSelection(user.email)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(user.email)}
                      onChange={() => toggleEmailSelection(user.email)}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: "#1a202c" }}>{user.email}</div>
                      <div style={{ fontSize: "12px", color: "#718096" }}>
                        {user.nomUtilisateur || user.email.split('@')[0]} • Rôle: <strong>{user.role || "Utilisateur"}</strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                  Aucun utilisateur trouvé avec le rôle sélectionné
                </div>
              )}
            </div>
          </div>

          <div className="leoni-form-group">
            <label>Message personnalisé (optionnel)</label>
            <textarea
              className="leoni-textarea"
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ajoutez un message personnalisé qui sera inclus dans l'email..."
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
            />
          </div>
        </div>

        <div className="leoni-modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "16px", borderTop: "1px solid #e2e8f0" }}>
          <button type="button" className="leoni-btn leoni-btn-outline" onClick={onClose} style={{ padding: "8px 16px" }}>
            Annuler
          </button>
          <button 
            type="button" 
            className="leoni-btn leoni-btn-primary" 
            onClick={handleConfirm}
            disabled={selectedEmails.length === 0}
            style={{
              background: selectedEmails.length === 0 ? "#ccc" : "#C8102E",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              cursor: selectedEmails.length === 0 ? "not-allowed" : "pointer"
            }}
          >
            {action === "suppression" ? "Confirmer la suppression" : `📧 Envoyer à ${selectedEmails.length} destinataire(s)`}
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

  const [userRole, setUserRole] = useState(null);
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
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [modalAction, setModalAction] = useState("création");
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const [formData, setFormData] = useState(buildDefaultForm());

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
    }
  }, []);

  const loadAllUsersWithEmails = async () => {
    try {
      setLoadingUsers(true);
      console.log("Chargement des utilisateurs...");
      const response = await userService.getAllUsersWithEmails();
      console.log("Utilisateurs chargés:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        const relevantUsers = response.data.filter(user => 
          user.role === "HP" || user.role === "SGL" || user.role === "QM_PLANT"
        );
        setUsersList(relevantUsers);
        console.log("Utilisateurs filtrés:", relevantUsers);
      } else {
        setUsersList([]);
      }
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
      try {
        const emailResponse = await userService.getAllEmails();
        const emailList = emailResponse.data.map(email => ({ 
          email, 
          nomUtilisateur: email, 
          role: "UNKNOWN" 
        }));
        setUsersList(emailList);
      } catch (e) {
        setUsersList([]);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!matricule) return;
    loadData();
  }, [matricule]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadFautes(),
      loadCollaborator(),
      loadResumes(),
      loadAllEntretiens(),
      loadAllUsersWithEmails()
    ]);
    loadDraft();
    setLoading(false);
  };

  const resetForm = () => {
    setFormData(buildDefaultForm());
    setCurrentEntretienId(null);
    if (matricule) {
      localStorage.removeItem(`entretien-decision-draft-${matricule}`);
    }
  };

  const loadCollaborator = async () => {
    try {
      const collab = await collaboratorService.getById(matricule);
      setCollaborator(collab.data);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les données du collaborateur.");
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
      showSuccessToast("Faute ajoutée");
    } catch { setError("Erreur ajout faute"); showErrorAlert("Ajout impossible", "Erreur lors de l'ajout du type de faute."); }
  };

  const handleEnregistrer = () => {
    setSavingDraft(true);
    try {
      const payload = { ...formData, id: currentEntretienId };
      localStorage.setItem(`entretien-decision-draft-${matricule}`, JSON.stringify(payload));
      setStatusMessage("Brouillon enregistré avec succès.");
      showSuccessToast("Brouillon enregistré");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch { setError("Impossible d'enregistrer le brouillon."); showErrorAlert("Brouillon non enregistré", "Impossible d'enregistrer le brouillon."); }
    finally { setSavingDraft(false); }
  };

  const handleAjouter = () => {
    resetForm();
    setStatusMessage("Nouveau formulaire prêt.");
    showInfoToast("Formulaire réinitialisé");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  const handleModifier = async () => {
    if (entretiensList.length === 0) {
      setError("Aucun entretien de décision existant à modifier.");
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
      
      await entretienDecisionService.deleteWithNotification(matricule, currentEntretienId, destinataireEmail, nomCollab);
      
      resetForm();
      await loadAllEntretiens();
      setStatusMessage("Entretien de décision supprimé avec succès. Email envoyé.");
      await showSuccessAlert("Entretien supprimé", "L'entretien de décision a bien été supprimé.");
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 1500);
    } catch (err) {
      setError("Erreur lors de la suppression : " + (err.response?.data?.message || err.message));
      showErrorAlert("Suppression impossible", err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  // ✅ CORRECTION: Fonction submitWithEmails corrigée
  const submitWithEmails = async (emails, message) => {
    console.log("=== submitWithEmails ===");
    console.log("Emails sélectionnés:", emails);
    console.log("Message:", message);
    console.log("Modal action:", modalAction);
    console.log("Current entretien ID:", currentEntretienId);
    
    setShowEmailModal(false);
    setPendingSubmit(true);
    
    try {
      if (!formData.typeFaute) {
        throw new Error("Le type de faute est obligatoire");
      }
      if (!formData.decision) {
        throw new Error("La décision est obligatoire");
      }
      
      // ✅ Correction: Envoyer la liste d'emails directement (pas de join)
      // ✅ Correction: Utiliser messageOptionnel au lieu de message
      const payload = { 
        typeFaute: formData.typeFaute,
        dateEntretien: formData.dateEntretien,
        decision: formData.decision,
        justification: formData.justification || "",
        destinatairesEmails: emails,  // Envoyer comme tableau
        messageOptionnel: message || ""  // Nom correct du champ
      };
      
      console.log("Payload envoyé:", JSON.stringify(payload, null, 2));
      
      let response;
      
      if (modalAction === "validationSL" && currentEntretienId) {
        console.log("Appel à validerParSL");
        response = await entretienDecisionService.validerParSL(matricule, currentEntretienId, payload);
        setStatusMessage(`Entretien soumis. Emails envoyés à ${emails.length} destinataire(s).`);
        await showSuccessAlert("Entretien soumis", `${emails.length} email(s) envoyé(s).`);
      } 
      else if (modalAction === "modification" && currentEntretienId) {
        console.log("Appel à updateWithNotification");
        response = await entretienDecisionService.updateWithNotification(matricule, currentEntretienId, payload);
        setStatusMessage("Entretien modifié avec succès.");
        await showSuccessAlert("Entretien modifié", "La modification a été enregistrée.");
      }
      else if (modalAction === "création" && !currentEntretienId) {
        console.log("Appel à create");
        response = await entretienDecisionService.create(matricule, payload);
        if (response.data && response.data.id) {
          setCurrentEntretienId(response.data.id);
        }
        setStatusMessage("Entretien créé avec succès.");
        await showSuccessAlert("Entretien créé", "L'entretien de décision a été créé.");
      }
      else {
        throw new Error(`Action non reconnue: ${modalAction}, currentId: ${currentEntretienId}`);
      }
      
      console.log("Réponse backend:", response);
      
      localStorage.removeItem(`entretien-decision-draft-${matricule}`);
      await loadAllEntretiens();
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 2000);
      
    } catch (err) {
      console.error("Erreur détaillée:", err);
      let errorMessage = "Erreur lors de la sauvegarde";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      showErrorAlert("Enregistrement impossible", errorMessage);
    } finally { 
      setPendingSubmit(false);
    }
  };

  const submitWithoutEmail = async () => {
    console.log("=== submitWithoutEmail ===");
    console.log("User role:", userRole);
    console.log("Current entretien ID:", currentEntretienId);
    
    setSaving(true);
    
    try {
      if (!formData.typeFaute) {
        throw new Error("Le type de faute est obligatoire");
      }
      if (!formData.decision) {
        throw new Error("La décision est obligatoire");
      }
      
      const payload = { 
        typeFaute: formData.typeFaute,
        dateEntretien: formData.dateEntretien,
        decision: formData.decision,
        justification: formData.justification || "",
      };
      
      console.log("Payload validation sans email:", payload);

      if ((userRole === "HP" || userRole === "SGL") && currentEntretienId) {
        console.log("Appel à valider1 (HP/SGL)");
        await entretienDecisionService.valider1(matricule, currentEntretienId, payload);
        setStatusMessage("Entretien de décision validé (1ère validation).");
        await showSuccessAlert("Validation enregistrée", "Première validation effectuée.");
      } 
      else if (userRole === "QM_PLANT" && currentEntretienId) {
        console.log("Appel à valider2 (QM_PLANT)");
        await entretienDecisionService.valider2(matricule, currentEntretienId, payload);
        setStatusMessage("Entretien de décision validé (2ème validation).");
        await showSuccessAlert("Validation enregistrée", "L'entretien de décision est validé.");
      }
      else {
        throw new Error(`Action non autorisée pour le rôle: ${userRole}`);
      }
      
      localStorage.removeItem(`entretien-decision-draft-${matricule}`);
      await loadAllEntretiens();
      setTimeout(() => navigate(`/paq-dossier/${matricule}`), 2000);
      
    } catch (err) {
      console.error("Erreur détaillée:", err);
      let errorMessage = "Erreur lors de la sauvegarde";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      showErrorAlert("Enregistrement impossible", errorMessage);
    } finally { 
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); 
    setStatusMessage("");

    console.log("=== handleSubmit ===");
    console.log("User role:", userRole);
    console.log("Current entretien ID:", currentEntretienId);
    console.log("Form data:", formData);

    if (!formData.typeFaute) {
      setError("Veuillez sélectionner un type de faute.");
      return;
    }
    if (!formData.decision) {
      setError("Veuillez saisir une décision.");
      return;
    }

    if (userRole === "SL") {
      if (currentEntretienId) {
        console.log("SL: ouverture modale pour validation/modification");
        setModalAction("validationSL");
        setShowEmailModal(true);
      } else {
        console.log("SL: ouverture modale pour création");
        setModalAction("création");
        setShowEmailModal(true);
      }
    } else if ((userRole === "HP" || userRole === "SGL") && currentEntretienId) {
      console.log("HP/SGL: validation sans email");
      await submitWithoutEmail();
    } else if (userRole === "QM_PLANT" && currentEntretienId) {
      console.log("QM_PLANT: validation sans email");
      await submitWithoutEmail();
    } else {
      setError(`Action non autorisée pour votre rôle: ${userRole}`);
    }
  };

  const canCreate = userRole === "SL" || userRole === "ADMIN";
  const canModify = userRole === "SL" || userRole === "ADMIN";
  const canDelete = userRole === "SL" || userRole === "ADMIN";
  const canValidate1 = (userRole === "HP" || userRole === "SGL") || userRole === "ADMIN";
  const canValidate2 = userRole === "QM_PLANT" || userRole === "ADMIN";
  
  const isEditable = () => {
    if (userRole === "ADMIN") return true;
    if (userRole === "SL") return true;
    return false;
  };

  const showModifyButton = () => {
    if (userRole === "ADMIN" && currentEntretienId) return true;
    if (userRole === "SL" && currentEntretienId) return true;
    return false;
  };

  const estValideParHPSGL = () => entretiensList.some(e => e.statusHpSgl === "VALIDE");
  const estValideParQMPlant = () => entretiensList.some(e => e.statusQmPlant === "VALIDE");

  const getValiderLabel = () => {
    if (saving || pendingSubmit) return "Enregistrement...";
    if (userRole === "SL") {
      if (currentEntretienId) return "📝 Valider & Convoquer";
      return "➕ Créer & Convoquer";
    }
    if (userRole === "HP" || userRole === "SGL") {
      return estValideParHPSGL() ? "✅ Déjà validé (1ère)" : "🔵 Valider (1ère validation)";
    }
    if (userRole === "QM_PLANT") {
      return estValideParQMPlant() ? "✅ Déjà validé (2ème)" : "🟢 Valider (2ème validation)";
    }
    return "Valider";
  };

  const isValiderDisabled = () => {
    if (userRole === "HP" || userRole === "SGL") {
      if (estValideParHPSGL()) return true;
    }
    if (userRole === "QM_PLANT") {
      if (estValideParQMPlant()) return true;
      if (!estValideParHPSGL()) return true;
    }
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
        </div>
        <div className="leoni-header-actions" />
      </div>

      <div style={{ padding: "0 24px", marginBottom: 16 }}>
        {userRole === "SL" && (
          <div className="leoni-alert leoni-alert-info" style={{ background: "#e3f2fd", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #C8102E" }}>
            📝 <strong>Mode SL</strong> : Vous pouvez créer, modifier et valider l'entretien. 
            La validation envoie une convocation par email aux destinataires sélectionnés.
          </div>
        )}
        {(userRole === "HP" || userRole === "SGL") && (
          <div className="leoni-alert leoni-alert-info" style={{ background: "#e3f2fd", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #C8102E" }}>
            🔵 <strong>Mode {userRole}</strong> : Vous pouvez effectuer la <strong>1ère validation</strong>.
            {estValideParHPSGL() ? " Cet entretien a déjà été validé." : " Aucun email n'est envoyé."}
          </div>
        )}
        {userRole === "QM_PLANT" && (
          <div className="leoni-alert leoni-alert-info" style={{ background: "#e3f2fd", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #C8102E" }}>
            🟢 <strong>Mode QM_PLANT</strong> : Vous pouvez effectuer la <strong>2ème validation</strong>.
            {!estValideParHPSGL() && " (La validation HP/SGL est requise d'abord)"}
            {estValideParQMPlant() && " Cet entretien a déjà été validé."}
          </div>
        )}
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

          {currentEntretienId && (
            <div className="sd-card">
              <div className="sd-card-hd">Statut des validations</div>
              <div className="sd-card-bd">
                <div className="sd-info-cell">
                  <span className="sd-info-label">SL</span>
                  <span className={`sd-info-value`}>
                    {currentEntretienId ? "✅ Soumis" : "⏳ En attente"}
                  </span>
                </div>
                <div className="sd-info-cell">
                  <span className="sd-info-label">HP/SGL (1ère)</span>
                  <span className={`sd-info-value ${estValideParHPSGL() ? 'text-success' : 'text-warning'}`}>
                    {estValideParHPSGL() ? "✅ Validé" : "⏳ En attente"}
                  </span>
                </div>
                <div className="sd-info-cell">
                  <span className="sd-info-label">QM_PLANT (2ème)</span>
                  <span className={`sd-info-value ${estValideParQMPlant() ? 'text-success' : 'text-warning'}`}>
                    {estValideParQMPlant() ? "✅ Validé" : estValideParHPSGL() ? "⏳ En attente" : "🔒 Bloqué"}
                  </span>
                </div>
              </div>
            </div>
          )}
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
                  {(canCreate || canModify) && (
                    <button type="button" className="fd-btn fd-btn-draft" onClick={handleEnregistrer} disabled={savingDraft}>
                      {savingDraft ? "Enregistrement..." : "💾 Enregistrer Brouillon"}
                    </button>
                  )}
                  
                  {canCreate && !currentEntretienId && (
                    <button type="button" className="fd-btn fd-btn-ajouter" onClick={handleAjouter}>
                      ➕ Ajouter
                    </button>
                  )}
                  
                  {showModifyButton() && (
                    <button type="button" className="fd-btn fd-btn-modifier" onClick={handleModifier} disabled={savingDraft}>
                      📝 Modifier
                    </button>
                  )}
                  
                  {(canCreate || canValidate1 || canValidate2) && (
                    <button 
                      type="submit" 
                      className="fd-btn fd-btn-valider" 
                      disabled={saving || pendingSubmit || isValiderDisabled()}
                      title={isValiderDisabled() ? "Validation déjà effectuée ou conditions non remplies" : ""}
                      style={{
                        background: "#C8102E",
                        color: "white"
                      }}
                    >
                      {getValiderLabel()}
                    </button>
                  )}
                  
                  {canDelete && currentEntretienId && (
                    <button 
                      type="button" 
                      className="fd-btn fd-btn-supprimer" 
                      onClick={() => {
                        setModalAction("suppression");
                        setShowEmailModal(true);
                      }}
                    >
                      🗑️ Supprimer
                    </button>
                  )}
                  
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
        onClose={() => {
          setShowEmailModal(false);
          setModalAction("création");
        }}
        onConfirm={modalAction === "suppression" ? handleDeleteConfirm : submitWithEmails}
        usersList={usersList}
        loadingUsers={loadingUsers}
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