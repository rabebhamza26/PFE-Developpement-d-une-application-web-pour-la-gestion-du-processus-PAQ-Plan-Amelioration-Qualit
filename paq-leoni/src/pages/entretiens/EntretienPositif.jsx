import React, { useEffect, useMemo, useState } from "react";
import { entretienPositifService, userService } from "../../services/api";
import "../../styles/entretien-positif.css";

export default function EntretienPositif() {
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [sending, setSending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  
  // Liste des emails
  const [emailsList, setEmailsList] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);

  const [slDestinataire, setSlDestinataire] = useState("");
  const [dateEnvoi, setDateEnvoi] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  // Charger les collaborateurs
  const loadSansFaute = async () => {
    try {
      setLoading(true);
      console.log("Chargement des collaborateurs sans faute...");
      const res = await entretienPositifService.getSansFaute();
      console.log("Réponse API:", res.data);
      
      const data = res.data || [];
      setCollaborateurs(data);
      setSelected({});
      
      if (data.length === 0) {
        console.log("Aucun collaborateur trouvé");
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
      setEmailStatus("error:Erreur lors du chargement des données: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Charger la liste des emails
  const loadEmails = async () => {
    try {
      setLoadingEmails(true);
      const res = await userService.getAllEmails();
      console.log("Emails récupérés:", res.data);
      setEmailsList(res.data || []);
    } catch (err) {
      console.error("Erreur chargement emails:", err);
      // Fallback: essayer de récupérer tous les utilisateurs
      try {
        const usersRes = await userService.getAllUsers();
        const emails = usersRes.data.map(user => user.email).filter(email => email);
        setEmailsList(emails);
      } catch (error) {
        console.error("Erreur fallback emails:", error);
      }
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    loadSansFaute();
    loadEmails(); // Charger les emails au chargement du composant
  }, []);

  // Fonction pour formater le nombre de mois
  const getMoisEntreDates = (dateDebut, dateFin) => {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    
    let mois = (end.getFullYear() - start.getFullYear()) * 12;
    mois -= start.getMonth();
    mois += end.getMonth();
    
    if (end.getDate() < start.getDate()) {
      mois--;
    }
    
    return mois <= 0 ? 0 : mois;
  };

  // Fonction pour obtenir la période en mois
  const getPeriodeEnMois = (collaborateur) => {
    const now = new Date();
    let dateDebut;
    
    if (collaborateur.derniereFaute) {
      dateDebut = new Date(collaborateur.derniereFaute);
      dateDebut.setDate(dateDebut.getDate() + 1);
    } else if (collaborateur.hireDate) {
      dateDebut = new Date(collaborateur.hireDate);
    } else {
      return "Période non définie";
    }
    
    const mois = getMoisEntreDates(dateDebut, now);
    
    if (mois === 0) return "< 1 mois";
    if (mois === 1) return "1 mois";
    return `${mois} mois`;
  };

  const toggleAll = (checked) => {
    const next = {};
    collaborateurs.forEach((c) => { next[c.matricule] = checked; });
    setSelected(next);
  };

  const handleExportPdf = async () => {
    try {
      setEmailStatus("");
      const res = await entretienPositifService.exportPdf();
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "collaborateurs_sans_faute.pdf";
      link.click();
      window.URL.revokeObjectURL(url);
      setEmailStatus("success:PDF exporté avec succès");
    } catch (err) {
      console.error("Erreur export PDF:", err);
      setEmailStatus("error:Erreur lors de l'export PDF: " + (err.response?.data?.message || err.message));
    }
  };

  const selectedMatricules = Object.keys(selected).filter((k) => selected[k]);
  const selectedCount = selectedMatricules.length;
  const allSelected = collaborateurs.length > 0 && collaborateurs.every((c) => selected[c.matricule]);

  const handleSendToSL = async () => {
    if (!slDestinataire.trim()) {
      setEmailStatus("error:Veuillez sélectionner ou saisir une adresse email");
      return;
    }
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(slDestinataire)) {
      setEmailStatus("error:Adresse email invalide");
      return;
    }
    if (!dateEnvoi) {
      setEmailStatus("error:Veuillez choisir une date d'envoi");
      return;
    }

    try {
      setSending(true);
      setEmailStatus("");
      const matricules = selectedCount > 0 ? selectedMatricules : collaborateurs.map((c) => c.matricule);

      const payload = {
        matricules,
        slDestinataire: slDestinataire.trim(),
        dateEnvoi,
        message: note,
      };

      console.log("Envoi payload:", payload);
      const res = await entretienPositifService.envoyerAuSL(payload);
      console.log("Réponse envoi:", res.data);
      
      if (res.data.success) {
        setEmailStatus("success:Email envoyé avec succès à " + slDestinataire);
        // Optionnel: vider le champ après envoi
        // setSlDestinataire("");
        // setNote("");
      } else {
        setEmailStatus("warning:" + (res.data.message || "Email envoyé avec avertissement"));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Erreur lors de l'envoi de l'email";
      console.error("Erreur envoi email:", err);
      setEmailStatus("error:" + msg);
    } finally {
      setSending(false);
    }
  };

  const handleArchiver = async () => {
    const matricules = selectedCount > 0 ? selectedMatricules : collaborateurs.map((c) => c.matricule);
    if (matricules.length === 0) {
      setEmailStatus("error:Aucun collaborateur à archiver");
      return;
    }
    if (!window.confirm(`Archiver ${matricules.length} entretien(s) positif(s) ?`)) return;

    try {
      setArchiving(true);
      setEmailStatus("");
      const res = await entretienPositifService.archiverEtCreer({ matricules });
      console.log("Réponse archivage:", res.data);
      
      if (res.data.success) {
        setEmailStatus("success:" + res.data.archivedCount + " dossier(s) archivé(s) avec succès");
        await loadSansFaute();
      } else {
        const errMsg = res.data.errors?.join(", ") || "Archivage partiel";
        setEmailStatus("warning:Archivage partiel – " + errMsg);
      }
    } catch (err) {
      console.error("Erreur archivage:", err);
      setEmailStatus("error:Erreur lors de l'archivage: " + (err.response?.data?.message || err.message));
    } finally {
      setArchiving(false);
    }
  };

  const parseStatus = (status) => {
    if (!status) return { type: "", msg: "" };
    const idx = status.indexOf(":");
    if (idx === -1) return { type: "info", msg: status };
    return { type: status.substring(0, idx), msg: status.substring(idx + 1) };
  };

  const { type: statusType, msg: statusMsg } = parseStatus(emailStatus);

  return (
    <div className="ep-page">
      <div className="ep-topbar">
        <div className="ep-topbar-left">
          <div className="ep-breadcrumb">
            <span className="ep-breadcrumb-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="currentColor"/>
              </svg>
            </span>
            Entretien Positif
          </div>
          <div className="ep-subtitle">
            Collaborateurs sans faute
          </div>
        </div>
        <div className="ep-topbar-actions">
          <button className="ep-btn ep-btn-outline" onClick={loadSansFaute} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round"/>
            </svg>
            Actualiser
          </button>
          <button className="ep-btn ep-btn-outline ep-btn-pdf" onClick={handleExportPdf}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round"/>
              <polyline points="9 15 12 18 15 15" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Exporter PDF
          </button>
        </div>
      </div>

      {emailStatus && (
        <div className={`ep-alert ep-alert-${statusType}`}>
          <span className="ep-alert-icon">
            {statusType === "success" && "✓"}
            {statusType === "error" && "✕"}
            {statusType === "warning" && "⚠"}
          </span>
          {statusMsg}
        </div>
      )}

      <div className="ep-grid">
        <section className="ep-panel">
          <div className="ep-panel-header">
            <div>
              <h3 className="ep-panel-title">Collaborateurs à féliciter</h3>
            </div>
            <span className="ep-badge">
              {selectedCount > 0
                ? `${selectedCount} / ${collaborateurs.length}`
                : collaborateurs.length}
            </span>
          </div>

          {loading ? (
            <div className="ep-loading">
              <div className="ep-spinner" />
              <span>Chargement en cours…</span>
            </div>
          ) : (
            <div className="ep-table-wrapper">
              <table className="ep-table">
                <thead>
                  <tr>
                    <th className="ep-th-check">
                      {collaborateurs.length > 0 && (
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => toggleAll(e.target.checked)}
                          className="ep-checkbox"
                        />
                      )}
                    </th>
                    <th>Collaborateur</th>
                    <th>Matricule</th>
                    <th>Période</th>
                    <th>Jours sans faute</th>
                  </tr>
                </thead>
                <tbody>
                  {collaborateurs.map((c) => (
                    <tr
                      key={c.matricule}
                      className={selected[c.matricule] ? "ep-row ep-row-selected" : "ep-row"}
                    >
                      <td className="ep-td-check">
                        <input
                          type="checkbox"
                          checked={selected[c.matricule] || false}
                          onChange={(e) =>
                            setSelected({ ...selected, [c.matricule]: e.target.checked })
                          }
                          className="ep-checkbox"
                        />
                      </td>
                      <td>
                        <div className="ep-collab-info">
                          <div className="ep-avatar">
                            {(c.nom || "?")[0]?.toUpperCase()}
                            {(c.prenom || "")[0]?.toUpperCase()}
                          </div>
                          <span className="ep-collab-name">
                            {c.nom} {c.prenom}
                          </span>
                        </div>
                      </td>
                      <td className="ep-td-muted">{c.matricule}</td>
                      <td className="ep-td-muted">
                        {getPeriodeEnMois(c)}
                      </td>
                      <td>
                        <span className="ep-days-badge">{c.joursSansFaute || 0} j</span>
                      </td>
                    </tr>
                  ))}
                  {collaborateurs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="ep-empty">
                        <div className="ep-empty-icon">📋</div>
                        <div>Aucun collaborateur trouvé</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {collaborateurs.length > 0 && (
            <div className="ep-archive-zone">
              <button
                className="ep-btn ep-btn-archive"
                onClick={handleArchiver}
                disabled={archiving}
              >
                {archiving ? "Archivage…" : "Archiver les entretiens"}
              </button>
            </div>
          )}
        </section>

        <section className="ep-panel">
          <div className="ep-panel-header">
            <div>
              <h3 className="ep-panel-title">Envoi EMAIL</h3>
            </div>
          </div>

          <div className="ep-form">
            <div className="ep-form-field">
              <label className="ep-label">
                Email du SL
              </label>
              
              {/* REMPLACER L'INPUT PAR UN COMBOBOX/DROPDOWN */}
              <div className="ep-email-select-container">
                <select
                  value={slDestinataire}
                  onChange={(e) => setSlDestinataire(e.target.value)}
                  className="ep-input ep-select"
                  disabled={loadingEmails}
                >
                  <option value="">-- Sélectionnez un email --</option>
                  {emailsList.map((email, index) => (
                    <option key={index} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
                
                {/* Optionnel: permettre aussi de saisir manuellement */}
                <div className="ep-or-divider">
                  <span>ou</span>
                </div>
                <input
                  type="email"
                  placeholder="Saisir manuellement un email"
                  value={slDestinataire}
                  onChange={(e) => setSlDestinataire(e.target.value)}
                  className="ep-input"
                />
              </div>
              
              {loadingEmails && (
                <div className="ep-loading-small">Chargement des emails...</div>
              )}
              {emailsList.length === 0 && !loadingEmails && (
                <div className="ep-warning-small">Aucun email trouvé dans la base</div>
              )}
            </div>

            <div className="ep-form-field">
              <label className="ep-label">
                Date d'envoi
              </label>
              <input
                type="date"
                value={dateEnvoi}
                onChange={(e) => setDateEnvoi(e.target.value)}
                className="ep-input"
              />
            </div>

            <div className="ep-form-field ep-form-field-full">
              <label className="ep-label">Message</label>
              <textarea
                placeholder="Ajoutez un message"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="ep-textarea"
                rows={4}
              />
            </div>

            <button
              className="ep-btn ep-btn-primary ep-btn-full"
              onClick={handleSendToSL}
              disabled={sending || collaborateurs.length === 0}
            >
              {sending ? (
                <>
                  <div className="ep-btn-spinner" />
                  Envoi en cours…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Envoyer l'email
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}