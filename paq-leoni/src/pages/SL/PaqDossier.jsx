import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collaboratorService, paqService, fauteService } from "../../services/api";
import "../../styles/paq-dossier.css";

export default function PaqDossier() {
  const { matricule } = useParams();
  const navigate      = useNavigate();

  const [collaborator,  setCollaborator]  = useState(null);
  const [currentPaq,    setCurrentPaq]    = useState(null);
  const [historique,    setHistorique]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [showFauteModal, setShowFauteModal] = useState(false);
  const [fauteDetail,   setFauteDetail]   = useState("");
  const [fautesList,    setFautesList]    = useState([]);
  const [fautesLoading, setFautesLoading] = useState(false);

  useEffect(() => { loadData(); }, [matricule]);

  // ── Chargement données ────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // 1. Collaborateur
      const collabRes = await collaboratorService.getById(matricule);
      setCollaborator(collabRes.data);

      // 2. PAQ actif uniquement (période en cours, 6 mois)
      try {
        const paqsRes = await paqService.getAllByMatricule(matricule);
        const paqs    = paqsRes.data || [];

        // On prend UNIQUEMENT le PAQ actif (actif=true, archived=false)
        const active = paqs.find(p => p.actif === true && p.archived === false) || null;
        setCurrentPaq(active);

        // Historique du PAQ actif uniquement
        if (active?.historique) {
          try { setHistorique(JSON.parse(active.historique)); }
          catch { setHistorique([]); }
        } else {
          setHistorique([]);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setCurrentPaq(null);
          setHistorique([]);
        } else throw err;
      }
    } catch (err) {
      setError("Impossible de charger les données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Chargement liste de fautes ────────────────────────────────────────────
  const loadFautes = async () => {
    try {
      setFautesLoading(true);
      const res = await fauteService.getAll();
      setFautesList(res.data || []);
    } catch {
      setFautesList([]);
    } finally {
      setFautesLoading(false);
    }
  };

  const openFauteModal = () => {
    setFauteDetail("");
    setShowFauteModal(true);
    loadFautes();
  };

  // ── Créer PAQ ─────────────────────────────────────────────────────────────
  const createPaq = async () => {
    try {
      setLoading(true);
      const res = await paqService.create(matricule);
      if (res.data) {
        setCurrentPaq(res.data);
        if (res.data.historique) setHistorique(JSON.parse(res.data.historique));
        showSuccess("Dossier PAQ créé avec succès !");
       
      }
    } catch (err) {
      showError(err.response?.data?.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  // ── Enregistrer faute ──────────────────────────────────────────────────────
  const enregistrerFaute = async () => {
    if (!fauteDetail) {
      showError("Veuillez sélectionner un type de faute.");
      return;
    }
    try {
      setLoading(true);
      const res = await paqService.enregistrerFaute(matricule, {
        detail: fauteDetail,
        type:   "STANDARD",
      });
      if (res.data) {
        const updatedPaq = res.data.paq || res.data;
        setCurrentPaq(updatedPaq);
        if (updatedPaq?.historique) setHistorique(JSON.parse(updatedPaq.historique));
        setShowFauteModal(false);
        setFauteDetail("");
        showSuccess(res.data.message || "Faute enregistrée avec succès");
       
      }
    } catch (err) {
      showError(err.response?.data?.message || "Erreur lors de l'enregistrement de la faute");
    } finally {
      setLoading(false);
    }
  };

  // ── Archiver PAQ ───────────────────────────────────────────────────────────
  const archiverPaq = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir archiver ce dossier ?")) return;
    try {
      setLoading(true);
      await paqService.archive(matricule);
      setCurrentPaq(null);
      setHistorique([]);
      showSuccess("Dossier archivé avec succès");
    } catch (err) {
      showError(err.response?.data?.message || "Erreur lors de l'archivage");
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers messages ──────────────────────────────────────────────────────
  const showSuccess = (msg) => { setActionMessage(msg); setTimeout(() => setActionMessage(""), 4000); };
  const showError   = (msg) => { setError(msg);         setTimeout(() => setError(""),         4000); };

  // ── Logique boutons ───────────────────────────────────────────────────────

  /** PAQ clôturé ou archivé → lecture seule */
  const isBlocked = currentPaq?.statut === "CLOTURE" || currentPaq?.archived;

  /** true si la date de fin du PAQ est dépassée */
  const isPaqExpire = () =>
    !!currentPaq?.dateFin && new Date(currentPaq.dateFin) <= new Date();

  /** true si une faute a été déclarée */
  const aUneFaute = () => !!currentPaq?.derniereFaute;

  /**
   * RÈGLE PRINCIPALE :
   * "Déclarer Faute" s'affiche UNIQUEMENT si niveau === 0 ET aucune faute.
   * Dès qu'une faute est déclarée, ce bouton disparaît et les boutons
   * d'entretien apparaissent.
   */
  const peutDeclarerFaute = () =>
    !!currentPaq && !isBlocked && currentPaq.niveau === 0 && !aUneFaute();

  /**
   * Les boutons d'entretien ne s'affichent QUE si une faute a été déclarée
   * (ou si le niveau > 0, ce qui signifie qu'un entretien a déjà eu lieu).
   */
  const peutVoirEntretiens = () =>
    !!currentPaq && !isBlocked && (aUneFaute() || currentPaq.niveau > 0);

  /** Prochain entretien selon le niveau actuel */
  const getProchainEntretien = () => {
    if (!peutVoirEntretiens()) return null;
    const map = {
      0: { nom: "Entretien Explicatif",  route: `/entretien-explicatif/${matricule}` },
      1: { nom: "Entretien d'Accord",    route: `/entretien-daccord/${matricule}` },
      2: { nom: "Entretien de Mesure",   route: `/entretien-de-mesure/${matricule}` },
      3: { nom: "Entretien de Décision", route: `/entretien-de-decision/${matricule}` },
      4: { nom: "Entretien Final",       route: `/entretien-final/${matricule}` },
    };
    return map[currentPaq.niveau] || null;
  };

  /** Peut créer un PAQ ? (pas de PAQ actif + ancienneté OK) */
  const peutCreerPaq = () => {
    if (currentPaq) return false;
    if (!collaborator?.hireDate) return false;
    const limit = new Date(collaborator.hireDate);
    limit.setMonth(limit.getMonth() + 6);
    return new Date() >= limit;
  };

  // ── Progression période ───────────────────────────────────────────────────
  const getPaqProgress = () => {
    if (!currentPaq?.dateCreation || !currentPaq?.dateFin) return 0;
    const start   = new Date(currentPaq.dateCreation);
    const end     = new Date(currentPaq.dateFin);
    const elapsed = new Date() - start;
    return Math.min(100, Math.max(0, Math.round((elapsed / (end - start)) * 100)));
  };

  // ── Formatage ─────────────────────────────────────────────────────────────
  const formatDate = (d) => {
    if (!d) return "–";
    try {
      return new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric",
      });
    } catch { return d; }
  };

  const formatHistoriqueDetail = (detail, date) => {
    if (!detail) return detail;
    let s = String(detail)
      .replace(/\s*-\s*Niveau\s+(descendant|ascendant)\s+de\s+(\d+)\s+à\s+(\d+)\s*/gi,
        (m, _d, from, to) => (from === to ? " - " : m))
      .replace(/\s*-\s*-\s*/g, " - ")
      .replace(/^\s*-\s*/g, "")
      .replace(/\s*-\s*$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    return s.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y, m, d) => `${d}/${m}/${y}`);
  };

  const getBadgeClass = (action = "") => {
    const a = action.toLowerCase();
    if (a.includes("entretien"))  return "leoni-badge leoni-badge-blue";
    if (a.includes("faute"))      return "leoni-badge leoni-badge-red";
    if (a.includes("création"))   return "leoni-badge leoni-badge-green";
    if (a.includes("archiv"))     return "leoni-badge leoni-badge-gray";
    return "leoni-badge leoni-badge-gray";
  };

  const handleHistoriqueClick = (action) => {
   if (!action) return;
    const a = action.toLowerCase();

    // Chaque action ouvre la page de l'entretien correspondant
    if (a.includes("explicatif"))                               navigate(`/entretien-explicatif/${matricule}`);
    else if (a.includes("accord"))                              navigate(`/entretien-daccord/${matricule}`);
    else if (a.includes("mesure"))                              navigate(`/entretien-de-mesure/${matricule}`);
    else if (a.includes("décision") || a.includes("decision")) navigate(`/entretien-de-decision/${matricule}`);
    else if (a.includes("final"))                               navigate(`/entretien-final/${matricule}`);
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="leoni-loading">
        <div className="leoni-spinner"></div>
        <p>Chargement du dossier...</p>
      </div>
    );
  }

  const prochainEntretien = getProchainEntretien();

  return (
    <div className="leoni-shell">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="leoni-header">

        <div className="leoni-header-left">
          <button onClick={() => navigate("/collaborateurs")} className="leoni-btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour
          </button>
        </div>

        <div className="leoni-header-title">
          <div className="leoni-logo-bar">
            <div className="leoni-logo-accent"></div>
            <h1>Dossier PAQ</h1>
          </div>
          {collaborator && (
            <span className="leoni-header-sub">
              {collaborator.name} {collaborator.prenom} — {collaborator.matricule}
            </span>
          )}
        </div>

        <div className="leoni-header-actions">

          {/* Créer PAQ — uniquement si pas de PAQ actif et 6 mois atteints */}
          {!currentPaq && peutCreerPaq() && (
            <button onClick={createPaq} className="leoni-btn leoni-btn-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Créer PAQ
            </button>
          )}

          {currentPaq && !isBlocked && (
            <>
              {/* ── ÉTAPE 1 : Déclarer la faute (niveau 0, pas encore de faute) ── */}
              {peutDeclarerFaute() && (
                <button onClick={openFauteModal} className="leoni-btn leoni-btn-warning">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Déclarer Faute
                </button>
              )}

              {/* ── ÉTAPE 2 : Passer à l'entretien (après faute déclarée) ── */}
              {prochainEntretien && (
                <button
                  onClick={() => navigate(prochainEntretien.route)}
                  className="leoni-btn leoni-btn-primary"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M8 12h8M13 8l4 4-4 4" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {prochainEntretien.nom}
                </button>
              )}

              {/* ── Archiver manuellement (période expirée) ── */}
              {isPaqExpire() && (
                <button onClick={archiverPaq} className="leoni-btn leoni-btn-outline">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <polyline points="21 8 21 21 3 21 3 8" stroke="currentColor" strokeWidth="2"/>
                    <rect x="1" y="3" width="22" height="5" rx="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Archiver
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── ALERTES ────────────────────────────────────────────────────────── */}
      {actionMessage && (
        <div className="leoni-alert leoni-alert-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {actionMessage}
          <button className="leoni-alert-close" onClick={() => setActionMessage("")}>✕</button>
        </div>
      )}
      {error && (
        <div className="leoni-alert leoni-alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
          <button className="leoni-alert-close" onClick={() => setError("")}>✕</button>
        </div>
      )}
      {isBlocked && (
        <div className="leoni-alert leoni-alert-warning">
          Ce dossier est <strong>{currentPaq?.statut === "CLOTURE" ? "clôturé" : "archivé"}</strong> — mode lecture seule
        </div>
      )}
      {currentPaq && !isBlocked && isPaqExpire() && (
        <div className="leoni-alert leoni-alert-warning">
          La période de 6 mois est <strong>écoulée</strong>. Ce dossier sera archivé automatiquement.
          Vous pouvez l'archiver manuellement dès maintenant.
        </div>
      )}

      {/* ── CONTENU PRINCIPAL ──────────────────────────────────────────────── */}
      <div className="leoni-grid-main">

        {/* ── COLONNE GAUCHE ────────────────────────────────────────────────── */}
        <div className="leoni-col-left">

          {/* Fiche collaborateur */}
          {collaborator && (
            <div className="leoni-card">
              <div className="leoni-card-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Informations Collaborateur
              </div>
              <div className="leoni-card-body">
                <div className="leoni-collab-avatar">
                  {`${collaborator.name?.[0] || ""}${collaborator.prenom?.[0] || ""}`.toUpperCase()}
                </div>
                <div className="leoni-collab-name">{collaborator.name} {collaborator.prenom}</div>
                <div className="leoni-collab-info-grid">
                  <div className="leoni-info-item">
                    <span className="leoni-info-label">Matricule</span>
                    <span className="leoni-info-value leoni-mono">{collaborator.matricule}</span>
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
                    <span className={`leoni-badge ${collaborator.status === "ACTIF" ? "leoni-badge-green" : "leoni-badge-gray"}`}>
                      {collaborator.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Niveau PAQ */}
          {currentPaq && (
            <div className="leoni-card leoni-card-niveau">
              <div className="leoni-card-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Niveau PAQ Actuel
                {currentPaq.statut === "CRITIQUE" && (
                  <span className="leoni-badge leoni-badge-red ms-auto">CRITIQUE</span>
                )}
              </div>
              <div className="leoni-card-body leoni-niveau-body">

                {/* Cercle de progression */}
                <div className="leoni-niveau-circle">
                  <svg viewBox="0 0 80 80" className="leoni-niveau-svg">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6"/>
                    <circle cx="40" cy="40" r="34" fill="none"
                      stroke={currentPaq.niveau === 0
                        ? "#f59e0b"
                        : currentPaq.statut === "CRITIQUE"
                          ? "#ef4444"
                          : "#005baa"}
                      strokeWidth="6"
                      strokeDasharray={`${(currentPaq.niveau / 5) * 213.6} 213.6`}
                      strokeDashoffset="53.4"
                      strokeLinecap="round"/>
                  </svg>
                  <div className="leoni-niveau-num">{currentPaq.niveau}<span>/5</span></div>
                </div>

                {/* Étapes */}
                <div className="leoni-niveau-steps">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`leoni-step ${n <= currentPaq.niveau ? "done" : n === currentPaq.niveau + 1 ? "next" : ""}`}>
                      <div className="leoni-step-dot">{n <= currentPaq.niveau ? "✓" : n}</div>
                      <div className="leoni-step-label">N{n}</div>
                    </div>
                  ))}
                </div>

                {/* Description état */}
                <div className="leoni-niveau-desc">
                  {currentPaq.niveau === 0 && !aUneFaute() && (
                    <span>⏳ En attente de la déclaration de faute</span>
                  )}
                  {currentPaq.niveau === 0 && aUneFaute() && (
                    <span>⚠️ Faute déclarée — Lancer l'entretien explicatif</span>
                  )}
                  {currentPaq.niveau === 1 && "Entretien explicatif réalisé"}
                  {currentPaq.niveau === 2 && "Entretien d'accord réalisé"}
                  {currentPaq.niveau === 3 && "Entretien de mesure réalisé"}
                  {currentPaq.niveau === 4 && "Entretien de décision réalisé"}
                  {currentPaq.niveau === 5 && "✅ Dossier clôturé avec succès"}
                </div>

                {/* Barre de progression période */}
                <div className="leoni-periode-bar">
                  <div className="leoni-periode-labels">
                    <span className="leoni-mono">{formatDate(currentPaq.dateCreation)}</span>
                    <span className="leoni-mono">{formatDate(currentPaq.dateFin)}</span>
                  </div>
                  <div className="leoni-progress-track">
                    <div className="leoni-progress-fill" style={{ width: `${getPaqProgress()}%` }}></div>
                  </div>
                  <div className="leoni-periode-pct">{getPaqProgress()}% de la période écoulée</div>
                </div>

                {/* Dernière faute */}
                {currentPaq.derniereFaute && (
                  <div className="leoni-last-faute">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Dernière faute : {formatDate(currentPaq.derniereFaute)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pas de PAQ actif */}
          {!currentPaq && collaborator && (
            <div className="leoni-card">
              <div className="leoni-card-body" style={{ textAlign: "center", padding: "32px 16px" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ color: "#cbd5e1", marginBottom: 12 }}>
                  <polyline points="21 8 21 21 3 21 3 8" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="1" y="3" width="22" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <p style={{ color: "#64748b", fontWeight: 500 }}>Aucun dossier PAQ en cours</p>
                {peutCreerPaq() ? (
                  <button onClick={createPaq} className="leoni-btn leoni-btn-success" style={{ marginTop: 12 }}>
                    Créer un dossier PAQ
                  </button>
                ) : (
                  <p className="leoni-info-notice" style={{ marginTop: 12 }}>
                    Disponible après 6 mois d'ancienneté
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── COLONNE DROITE ─────────────────────────────────────────────────── */}
        <div className="leoni-col-right">

          {/*
           * HISTORIQUE DU PAQ ACTIF (6 mois en cours) UNIQUEMENT
           * Les dossiers précédents ne s'affichent plus ici :
           * ils sont consultables via la page Archivage.
           */}
          <div className="leoni-card">
            <div className="leoni-card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Historique des Événements
              {currentPaq && (
                <span className="leoni-badge leoni-badge-blue ms-auto" style={{ fontSize: "11px" }}>
                  Période en cours
                </span>
              )}
              {historique.length > 0 && (
                <span className="leoni-badge leoni-badge-blue ms-2">{historique.length}</span>
              )}
            </div>
            <div className="leoni-card-body p-0">
              {!currentPaq ? (
                <div className="leoni-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p>Aucun dossier PAQ actif</p>
                  <small style={{ color: "#94a3b8" }}>
                    Les archives des dossiers précédents sont consultables dans la section Archivage.
                  </small>
                </div>
              ) : historique.length === 0 ? (
                <div className="leoni-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p>Aucun événement enregistré</p>
                  {peutDeclarerFaute() && (
                    <small style={{ color: "#94a3b8" }}>
                      Commencez par déclarer une faute pour démarrer le processus.
                    </small>
                  )}
                </div>
              ) : (
                <div className="leoni-table-wrap">
                  <table className="leoni-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Détail</th>
                      </tr>
                    </thead>
                    <tbody>
                     {historique
  .filter(h => {
    const action = (h.action || "").toLowerCase();
    return (
      !action.includes("creation suite entretien positif") &&
      !action.includes("augmentation")
    );
  })
  .map((h, i) => {
    const isEntretien = (h.action || "").toLowerCase().includes("entretien");
    return (
      <tr key={i}>
        <td className="leoni-mono leoni-td-date">{formatDate(h.date)}</td>
        <td>
          {isEntretien ? (
            // ✅ Cliquable → ouvre l'entretien spécifique
            <button
              onClick={() => handleHistoriqueClick(h.action)}
              className={`${getBadgeClass(h.action)} leoni-action-link`}
              style={{ cursor: "pointer" }}
            >
              {h.action}
            </button>
          ) : (
            // Non cliquable (création dossier, faute)
            <span className={getBadgeClass(h.action)}>
              {h.action}
            </span>
          )}
        </td>
        <td className="leoni-td-detail">
          {formatHistoriqueDetail(h.detail, h.date)}
        </td>
      </tr>
    );
  })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL DÉCLARER FAUTE ────────────────────────────────────────────── */}
      {showFauteModal && (
        <div className="leoni-modal-overlay" onClick={() => setShowFauteModal(false)}>
          <div className="leoni-modal" onClick={e => e.stopPropagation()}>

            <div className="leoni-modal-header">
              <div className="leoni-modal-icon leoni-modal-icon-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3>Déclarer une Faute</h3>
                <p>Sélectionnez le type de faute à enregistrer</p>
              </div>
              <button className="leoni-modal-close" onClick={() => setShowFauteModal(false)}>✕</button>
            </div>

            <div className="leoni-modal-body">
              <div className="leoni-form-group">
                <label>Type de faute <span className="leoni-required">*</span></label>
                {fautesLoading ? (
                  <div className="leoni-select-loading">
                    <div className="leoni-spinner leoni-spinner-sm"></div>
                    Chargement des fautes...
                  </div>
                ) : (
                  <select
                    className="leoni-select"
                    value={fauteDetail}
                    onChange={(e) => setFauteDetail(e.target.value)}
                  >
                    <option value="">— Sélectionner une faute —</option>
                    {fautesList.map((f, i) => (
                      <option key={i} value={f.nom || f.name || f}>
                        {f.nom || f.name || f}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="leoni-modal-notice leoni-modal-notice-warning">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="currentColor" strokeWidth="2"/>
                </svg>
                Après validation, le bouton <strong>"Entretien Explicatif"</strong> s'affichera automatiquement.
              </div>
            </div>

            <div className="leoni-modal-footer">
              <button
                onClick={() => { setShowFauteModal(false); setFauteDetail(""); }}
                className="leoni-btn leoni-btn-outline"
              >
                Annuler
              </button>
              <button
                onClick={enregistrerFaute}
                className="leoni-btn leoni-btn-warning"
                disabled={!fauteDetail}
              >
                Valider la faute
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}