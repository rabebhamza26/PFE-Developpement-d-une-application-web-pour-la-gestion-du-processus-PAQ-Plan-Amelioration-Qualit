import React, { useEffect, useState } from "react";
import { entretienPositifService } from "../../services/api";
import { showErrorAlert, showSuccessToast } from "../../utils/entretienAlerts";
import "../../styles/entretien-positif.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function EntretienPositif() {
  const [collaborateurs, setCollaborateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({});
  const [archiving, setArchiving] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  // Charger les collaborateurs
  const loadSansFaute = async () => {
    try {
      setLoading(true);
      const res = await entretienPositifService.getSansFaute();
      const data = res.data || [];
      setCollaborateurs(data);
      setSelected({});
      
      if (data.length === 0) {
        setEmailStatus("info:Aucun collaborateur éligible pour le moment");
      } else {
        showSuccessToast(`${data.length} collaborateur(s) éligible(s) à l'entretien positif`);
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
      setEmailStatus("error:Erreur lors du chargement des données");
      showErrorAlert("Erreur", "Impossible de charger les collaborateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSansFaute();
  }, []);

  // Calculer les jours sans faute
  const getJoursSansFaute = (collaborateur) => {
    return collaborateur.joursSansFaute || 0;
  };

  const getPeriodeEnMois = (collaborateur) => {
    const jours = getJoursSansFaute(collaborateur);
    const mois = Math.floor(jours / 30);
    if (mois === 0) return "< 1 mois";
    if (mois === 1) return "1 mois";
    return `${mois} mois`;
  };

  const handleArchiver = async () => {
    const selectedMatricules = Object.keys(selected).filter((k) => selected[k]);
    const matricules = selectedMatricules.length > 0 ? selectedMatricules : collaborateurs.map((c) => c.matricule);
    
    if (matricules.length === 0) {
      showErrorAlert("Aucun collaborateur", "Aucun collaborateur à archiver.");
      return;
    }

    try {
      setArchiving(true);
      const res = await entretienPositifService.archiverEtCreer({ matricules });
      
      if (res.data.success) {
        setEmailStatus("success:" + res.data.archivedCount + " dossier(s) archivé(s) avec succès");
        await loadSansFaute();
        setSelected({});
      } else {
        const errMsg = res.data.errors?.join(", ") || "Archivage partiel";
        setEmailStatus("warning:Archivage partiel : " + errMsg);
      }
    } catch (err) {
      console.error("Erreur archivage:", err);
      setEmailStatus("error:Erreur lors de l'archivage");
      showErrorAlert("Archivage impossible", "Erreur lors de l'archivage des dossiers.");
    } finally {
      setArchiving(false);
    }
  };

  const selectedMatricules = Object.keys(selected).filter((k) => selected[k]);
  const selectedCount = selectedMatricules.length;

  const parseStatus = (status) => {
    if (!status) return { type: "", msg: "" };
    const idx = status.indexOf(":");
    if (idx === -1) return { type: "info", msg: status };
    return { type: status.substring(0, idx), msg: status.substring(idx + 1) };
  };

  const { type: statusType, msg: statusMsg } = parseStatus(emailStatus);

  const handleExportPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Entretien Positif", 14, 20);

  doc.setFontSize(11);
  doc.text(
    `Date : ${new Date().toLocaleDateString("fr-FR")}`,
    14,
    30
  );

  const rows = collaborateurs.map((c) => {
    const joursSF = getJoursSansFaute(c);

    return [
      `${c.nom} ${c.prenom}`,
      c.matricule,
      getPeriodeEnMois(c),
      `${joursSF} jour${joursSF > 1 ? "s" : ""}`,
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: [["Collaborateur", "Matricule", "Période", "Jours sans faute"]],
    body: rows,
    styles: {
      fontSize: 10,
    },
    headStyles: {
      fillColor: [41, 128, 185],
    },
  });

  doc.save("entretien-positif.pdf");
};

  return (
    <div className="ep-page">
      <div className="ep-topbar">
        <div className="ep-topbar-left">
          <div className="ep-breadcrumb">Entretien Positif</div>
          <div className="ep-subtitle">Collaborateurs à féliciter </div>
        </div>
        <div className="ep-topbar-actions">
          <button className="ep-btn ep-btn-outline" onClick={loadSansFaute} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Actualiser
          </button>

          <button
  className="ep-btn ep-btn-outline"
  onClick={handleExportPDF}
  disabled={collaborateurs.length === 0}
>
   Exporter PDF
</button>
        </div>
      </div>

      {emailStatus && (
        <div className={`ep-alert ep-alert-${statusType}`}>
          <span className="ep-alert-icon">
            {statusType === "success" && "✓"}
            {statusType === "error" && "✗"}
            {statusType === "warning" && "⚠"}
            {statusType === "info" && "ℹ"}
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
            <div className="ep-stats">
              <span className="ep-badge">
                {selectedCount > 0 ? `${selectedCount} / ${collaborateurs.length}` : collaborateurs.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="ep-loading">
              <div className="ep-spinner" />
              <span>Chargement en cours…</span>
            </div>
          ) : (
            <div className="ep-table-wrapper">
              <table className="ep-table">
                <thead className="ep-table-header">
                  <tr>
                    <th className="ep-th-checkbox"></th>
                    <th className="ep-th-collab">Collaborateur</th>
                    <th className="ep-th-matricule">Matricule</th>
                    <th className="ep-th-periode">Période</th>
                    <th className="ep-th-jours">Jours sans faute</th>
                  </tr>
                </thead>
                <tbody>
                  {collaborateurs.map((c) => {
                    const joursSF = getJoursSansFaute(c);
                    const niveauBonus = joursSF >= 365 ? "ep-bonus-gold" : joursSF >= 180 ? "ep-bonus-silver" : "";
                    return (
                      <tr key={c.matricule} className={selected[c.matricule] ? "ep-row ep-row-selected" : "ep-row"}>
                        <td className="ep-td-check">
                          <input
                            type="checkbox"
                            checked={selected[c.matricule] || false}
                            onChange={(e) => setSelected({ ...selected, [c.matricule]: e.target.checked })}
                            className="ep-checkbox"
                          />
                        </td>
                        <td className="ep-td-collab">
                          <div className="ep-collab-info">
                            <div className="ep-avatar">
                              {(c.nom || "?")[0]?.toUpperCase()}
                              {(c.prenom || "")[0]?.toUpperCase()}
                            </div>
                            <span className="ep-collab-name">{c.nom} {c.prenom}</span>
                          </div>
                        </td>
                        <td className="ep-td-matricule">{c.matricule}</td>
                        <td className="ep-td-periode">{getPeriodeEnMois(c)}</td>
                        <td className="ep-td-jours">
                          <span className={`ep-days-badge ${niveauBonus}`}>
                            🏆 {joursSF} jour{joursSF > 1 ? "s" : ""}
                          </span>
                         </td>
                       </tr>
                    );
                  })}
                  {collaborateurs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="ep-empty">
                        <div className="ep-empty-icon">🎉</div>
                        <div>Aucun collaborateur éligible</div>
                        <small>Les emails seront envoyés automatiquement quand des collaborateurs atteindront 180 jours sans faute</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {collaborateurs.length > 0 && (
            <div className="ep-archive-zone">
              <button className="ep-btn ep-btn-archive" onClick={handleArchiver} disabled={archiving}>
                {archiving ? (
                  <>
                    <div className="ep-spinner-small" />
                    Archivage en cours...
                  </>
                ) : (
                  <>
                    📦 Archiver les entretiens positifs
                    {selectedCount > 0 && ` (${selectedCount})`}
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}