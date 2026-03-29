import React, { useEffect, useMemo, useState } from "react";
import { entretienPositifService } from "../../services/api";
import "../../styles/entretien-positif.css";

export default function EntretienPositif() {
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState({});
  const [sending, setSending] = useState(false);
  const [validating, setValidating] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const [slDestinataire, setSlDestinataire] = useState("");
  const [dateEnvoi, setDateEnvoi] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  // Charger la liste des collaborateurs "sans faute"
  const loadSansFaute = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await entretienPositifService.getSansFaute();
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      
      // Formater les données pour l'affichage
      const formattedData = data.map(c => ({
        ...c,
        nom: c.nom || c.name || "",
        prenom: c.prenom || "",
        depuis: c.hireDate ? new Date(c.hireDate).toLocaleDateString('fr-FR') : "-",
        joursSansFaute: c.joursSansFaute || 0,
        moisSansFaute: Math.floor((c.joursSansFaute || 0) / 30)
      }));
      
      setCollaborateurs(formattedData);
      // Réinitialiser la sélection
      setSelected({});
      setEmailSent(false);
      setValidationResult(null);
    } catch (err) {
      console.error("Erreur chargement:", err);
      setError("Impossible de charger la liste des collaborateurs sans faute.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSansFaute();
  }, []);

  // Label période (6 derniers mois)
  const periodeLabel = useMemo(() => {
    const now = new Date();
    const past = new Date();
    past.setMonth(now.getMonth() - 6);
    return `${past.toLocaleDateString("fr-FR")} - ${now.toLocaleDateString("fr-FR")}`;
  }, []);

  // Toggle sélection
  const toggleAll = (checked) => {
    const next = {};
    collaborateurs.forEach((c) => {
      next[c.matricule] = checked;
    });
    setSelected(next);
  };

  // Vérifier si tous les collaborateurs sont sélectionnés
  const allSelected = collaborateurs.length > 0 && 
    collaborateurs.every(c => selected[c.matricule]);

  // Vérifier si au moins un collaborateur est sélectionné
  const hasSelected = Object.values(selected).some(v => v === true);
  const selectedCount = Object.values(selected).filter(v => v === true).length;

  // Envoi au SL
  const handleSendToSL = async () => {
    if (collaborateurs.length === 0) {
      alert("❌ Aucun collaborateur sans faute à envoyer.");
      return;
    }
    if (!slDestinataire) {
      alert("❌ Veuillez sélectionner un SL destinataire.");
      return;
    }
    
    try {
      setSending(true);
      setEmailStatus("");
      
      // Récupérer les matricules sélectionnés ou tous si aucun sélectionné
      const matricules = hasSelected 
        ? Object.keys(selected).filter((k) => selected[k])
        : collaborateurs.map((c) => c.matricule);
      
      if (matricules.length === 0) {
        alert("❌ Aucun collaborateur sélectionné.");
        setSending(false);
        return;
      }
      
      const payload = {
        matricules: matricules,
        slDestinataire: slDestinataire,
        dateEnvoi: dateEnvoi,
        message: note || `Liste des ${matricules.length} collaborateur(s) sans faute depuis 6 mois`
      };
      
      const response = await entretienPositifService.envoyerAuSL(payload);
      
      if (response.data?.success !== false) {
        setEmailSent(true);
        setEmailStatus(`✅ Email envoyé au SL (${matricules.length} collaborateur(s)). Vous pouvez maintenant valider l'entretien positif.`);
      } else {
        setEmailStatus(`⚠️ ${response.data?.message || "Email envoyé mais avec des avertissements."}`);
        setEmailSent(true);
      }
      
    } catch (err) {
      console.error("Erreur envoi:", err);
      setEmailSent(false);
      setEmailStatus(`❌ Erreur lors de l'envoi: ${err.response?.data?.message || err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Valider l'entretien positif (archiver ancien PAQ et créer nouveau)
  const handleValiderEntretien = async () => {
    if (!emailSent) {
      alert("❌ Veuillez d'abord envoyer la liste au SL.");
      return;
    }
    
    // Récupérer les matricules à traiter
    const matricules = hasSelected 
      ? Object.keys(selected).filter((k) => selected[k])
      : collaborateurs.map((c) => c.matricule);
    
    if (matricules.length === 0) {
      alert("❌ Aucun collaborateur à traiter.");
      return;
    }
    
    if (!window.confirm(`Confirmez-vous l'entretien positif pour ${matricules.length} collaborateur(s) ?\n\nCette action va :\n- Archiver l'ancien dossier PAQ\n- Créer un nouveau dossier PAQ niveau 0\n- Réinitialiser le compteur de fautes`)) {
      return;
    }
    
    try {
      setValidating(true);
      setEmailStatus("");
      
      const payload = {
        matricules: matricules,
        slDestinataire: slDestinataire,
        dateEnvoi: dateEnvoi,
        note: note
      };
      
      const response = await entretienPositifService.archiverEtCreer(payload);
      const result = response.data;
      
      setValidationResult(result);
      
      if (result.success) {
        setEmailStatus(`✅ ${result.message} (${result.createdCount} nouveau(x) PAQ créé(s), ${result.archivedCount} archivé(s))`);
        // Recharger la liste après validation
        await loadSansFaute();
        setEmailSent(false);
      } else {
        setEmailStatus(`⚠️ ${result.message} - Erreurs: ${result.errors?.join(', ') || 'aucune'}`);
      }
      
    } catch (err) {
      console.error("Erreur validation:", err);
      setEmailStatus(`❌ Erreur lors de la validation: ${err.response?.data?.message || err.message}`);
    } finally {
      setValidating(false);
    }
  };

  const countSansFaute = collaborateurs.length;

  return (
    <div className="entretien-page">
      <div className="entretien-topbar">
        <div>
          <div className="entretien-breadcrumb">🏆 Entretien Positif</div>
        </div>
        <div className="entretien-top-actions">
          <button 
            className="btn-ghost" 
            onClick={handleSendToSL} 
            disabled={sending || loading || collaborateurs.length === 0}
          >
            {sending ? "📧 Envoi en cours..." : "📧 Envoyer au SL"}
          </button>
          <button 
            className="btn-primary" 
            onClick={handleValiderEntretien} 
            disabled={validating || !emailSent || collaborateurs.length === 0}
          >
            {validating ? "⏳ Validation..." : "✓ Valider entretien positif"}
          </button>
        </div>
      </div>

      <div className="entretien-highlight">
        <span className="highlight-icon">🎉</span>
        <span>
          <strong>{countSansFaute} collaborateur{countSansFaute > 1 ? 's' : ''}</strong> sans aucune faute sur 6 mois. 
          Cette liste est envoyée automatiquement au SL (Chef de ligne). 
          Une nouvelle fiche PAQ sera créée et l'historique archivé.
        </span>
      </div>

      {emailStatus && (
        <div className={`entretien-status ${emailStatus.includes('✅') ? 'success' : emailStatus.includes('❌') ? 'error' : 'warning'}`}>
          {emailStatus}
        </div>
      )}
      
      {error && <div className="entretien-alert error">{error}</div>}
      
      {validationResult && validationResult.createdCount > 0 && (
        <div className="entretien-alert success">
          ✅ {validationResult.createdCount} nouveau(x) dossier(s) PAQ créé(s)
        </div>
      )}

      <div className="entretien-grid">
        <section className="entretien-panel">
          <div className="panel-header">
            <div>
              <h3>Collaborateurs à féliciter</h3>
              <p>Aucune faute à 6 mois consécutifs ({periodeLabel})</p>
            </div>
            <div className="panel-badge">
              {selectedCount > 0 ? `${selectedCount}/${countSansFaute}` : countSansFaute}
            </div>
          </div>

          {loading ? (
            <div className="entretien-loading">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p>Chargement de la liste...</p>
            </div>
          ) : (
            <div className="collab-list">
              <div className="collab-row collab-head">
                <div className="entretien-check">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    disabled={collaborateurs.length === 0}
                  />
                </div>
                <div>Collaborateur</div>
                <div>Période sans faute</div>
                <div>Action</div>
              </div>
              
              {collaborateurs.map((c) => (
                <div key={c.matricule} className="collab-row">
                  <div className="entretien-check">
                    <input
                      type="checkbox"
                      checked={!!selected[c.matricule]}
                      onChange={(e) =>
                        setSelected((prev) => ({ ...prev, [c.matricule]: e.target.checked }))
                      }
                    />
                  </div>
                  <div className="collab-info">
                    <span className="collab-avatar">
                      {(c.nom || "?")[0]?.toUpperCase()}
                      {(c.prenom || "")[0]?.toUpperCase()}
                    </span>
                    <div>
                      <div className="collab-name">
                        <strong>{c.nom}</strong> {c.prenom}
                      </div>
                      <div className="collab-meta">
                        {c.matricule} – {c.segment || "Seg"} – Depuis {c.depuis || c.hireDate || "-"}
                      </div>
                    </div>
                  </div>
                  <div className="collab-stats">
                    <span className="badge bg-success">
                      {c.moisSansFaute} mois ({c.joursSansFaute} jours)
                    </span>
                  </div>
                  <div>
                    <button 
                      className="btn-success btn-sm"
                      onClick={() => {
                        setSelected(prev => ({ ...prev, [c.matricule]: true }));
                        if (!slDestinataire) setSlDestinataire("SL-SEG-04");
                      }}
                    >
                      🎉 FÉLICITER
                    </button>
                  </div>
                </div>
              ))}
              
              {collaborateurs.length === 0 && !loading && (
                <div className="entretien-empty">
                  <p>🎯 Aucun collaborateur sans faute sur les 6 derniers mois.</p>
                  <p className="text-muted small">Les collaborateurs ayant eu une faute récemment ne sont pas affichés.</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="entretien-panel">
          <div className="panel-header">
            <div>
              <h3>Confirmation d'envoi au SL</h3>
              <p>Destinataire + date d'envoi</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>SL destinataire *</label>
              <select 
                value={slDestinataire} 
                onChange={(e) => setSlDestinataire(e.target.value)}
                required
              >
                <option value="">Sélectionner un SL</option>
                <option value="sl@leoni.com">SL Général - sl@leoni.com</option>
                <option value="sl-seg04@leoni.com">Mourad Ben Ali – SEG-04</option>
                <option value="sl-seg03@leoni.com">Fatma Trabelsi – SEG-03</option>
                <option value="sl-seg02@leoni.com">Ahmed Mansouri – SEG-02</option>
                <option value="sl-seg01@leoni.com">Sofia Khelil – SEG-01</option>
              </select>
            </div>
            <div className="form-field">
              <label>Date d'envoi *</label>
              <input 
                type="date" 
                value={dateEnvoi} 
                onChange={(e) => setDateEnvoi(e.target.value)}
                required
              />
            </div>
            <div className="form-field full">
              <label>Note optionnelle</label>
              <textarea
                rows="3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Message joint à la liste (ex: félicitations, objectifs, etc.)..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="btn-primary wide" 
              onClick={handleSendToSL} 
              disabled={sending || !slDestinataire || collaborateurs.length === 0}
            >
              {sending ? "📧 Envoi en cours..." : "📧 Envoyer la notification email"}
            </button>
            <button 
              className="btn-success wide" 
              onClick={handleValiderEntretien} 
              disabled={validating || !emailSent || collaborateurs.length === 0}
            >
              {validating ? "⏳ Validation..." : "✓ Valider l'entretien positif"}
            </button>
          </div>
          
          {emailSent && (
            <div className="email-sent-info">
              <small>✅ Email envoyé. Vous pouvez maintenant valider l'entretien positif.</small>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}