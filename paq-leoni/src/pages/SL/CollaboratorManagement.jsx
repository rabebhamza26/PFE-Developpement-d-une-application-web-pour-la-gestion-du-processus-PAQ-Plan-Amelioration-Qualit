 import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collaboratorService, paqService } from "../../services/api";
import "../../styles/collaborator.css";

export default function CollaboratorManagement() {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [search, setSearch]               = useState("");
  const [sortMode, setSortMode]           = useState("latest_added");
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => { loadCollaborators(); }, []);

  const getSortableTimestamp = (collab) => {
    const raw = collab?.createdAt || collab?.updatedAt || collab?.hireDate;
    if (!raw) return 0;
    const time = new Date(raw).getTime();
    return Number.isFinite(time) ? time : 0;
  };

  const sortCollaborators = (list, latestMatricule, mode) => {
    const sorted = [...list];

    sorted.sort((a, b) => {
      if (mode === "matricule") {
        return String(a.matricule || "").localeCompare(String(b.matricule || ""), "fr", { numeric: true });
      }

      const aIsLatest = mode === "latest_added" && latestMatricule && String(a.matricule) === String(latestMatricule);
      const bIsLatest = mode === "latest_added" && latestMatricule && String(b.matricule) === String(latestMatricule);
      if (aIsLatest !== bIsLatest) return aIsLatest ? -1 : 1;

      const timeDiff = getSortableTimestamp(b) - getSortableTimestamp(a);
      if (timeDiff !== 0) return timeDiff;

      return String(a.matricule || "").localeCompare(String(b.matricule || ""), "fr", { numeric: true });
    });

    return sorted;
  };

  // ── Chargement ────────────────────────────────────────────────────────────
  const loadCollaborators = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await collaboratorService.getAll();
      let data = Array.isArray(response.data) ? response.data : response.data?.data || [];

      // Collaborateur fraîchement ajouté transmis par navigation
      const newCollab = location.state?.newCollaborator;
      const latestMatricule = newCollab?.matricule || sessionStorage.getItem("latest_collaborator_matricule");
      if (newCollab?.matricule) {
        const sameMatricule = (c) => String(c.matricule) === String(newCollab.matricule);
        const existing = data.find(sameMatricule);
        const prioritized = existing || newCollab;
        data = [prioritized, ...data.filter((c) => !sameMatricule(c))];
      }
      setCollaborators(sortCollaborators(data, latestMatricule, sortMode));
    } catch (err) {
      console.error(err);
      setError("Impossible de charger la liste des collaborateurs");
    } finally {
      setLoading(false);
    }
  };

  // ── Suppression ───────────────────────────────────────────────────────────
  const deleteCollaborator = async (matricule, fullName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${fullName} ?`)) return;
    try {
      await collaboratorService.delete(matricule);
      setCollaborators(prev => prev.filter(c => c.matricule !== matricule));
    } catch {
      alert("Erreur lors de la suppression du collaborateur");
    }
  };

  // ── Logique 6 mois ────────────────────────────────────────────────────────
  /** true si 6 mois d'ancienneté sont atteints */
  const hasSixMonthsPassed = (collab) => {
    if (!collab?.hireDate) return false;
    const limit = new Date(collab.hireDate);
    limit.setMonth(limit.getMonth() + 6);
    return new Date() >= limit;
  };

  /** Jours restants avant 6 mois */
  const daysUntilPaq = (collab) => {
    if (!collab?.hireDate) return null;
    const limit = new Date(collab.hireDate);
    limit.setMonth(limit.getMonth() + 6);
    const diff = Math.ceil((limit - new Date()) / 86_400_000);
    return diff > 0 ? diff : 0;
  };

  /**
   * Un PAQ est considéré "actif" dès que le statut du collaborateur
   * n'est pas "ACTIF" (aucun PAQ) ni "ARCHIVE" (terminé).
   * Adaptez selon votre modèle de données (ex: collab.paqActif === true).
   */
  const hasPaqActif = (collab) => {
    const s = (collab?.statut || "").toUpperCase();
    return s !== "ACTIF" && s !== "ARCHIVE" && s !== "";
  };

  // ── Action bouton "Créer PAQ" ──────────────────────────────────────────────
  const handleCreerPaq = async (collab) => {
    if (!hasSixMonthsPassed(collab)) {
      const days = daysUntilPaq(collab);
      alert(
        days != null
          ? `PAQ disponible dans ${days} jour(s). Les 6 mois d'ancienneté ne sont pas encore atteints.`
          : "PAQ disponible après 6 mois d'ancienneté."
      );
      return;
    }
    try {
      const response = await paqService.create(collab.matricule);
      if (response.data) {
        alert(`Dossier PAQ créé avec succès pour ${collab.nom || ""} ${collab.prenom || ""} !`);
        await loadCollaborators();                       // rafraîchir le statut
        navigate(`/paq-dossier/${collab.matricule}`);
      } else {
        alert("Impossible de créer le PAQ.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur serveur";
      const norm = msg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (norm.includes("existe deja")) {
        navigate(`/paq-dossier/${collab.matricule}`);
        return;
      }
      alert(msg);
    }
  };

  // ── Config visuelle bouton "Créer PAQ" ────────────────────────────────────
  const getCreerPaqConfig = (collab) => {
    const s = (collab.statut || "").toUpperCase();

    if (s === "ARCHIVE") {
      return { label: "Archivé", disabled: true,
               className: "action-btn btn-paq btn-paq-disabled",
               title: "Ce collaborateur est archivé" };
    }
    if (hasPaqActif(collab)) {
      return { label: "PAQ en cours", disabled: true,
               className: "action-btn btn-paq btn-paq-disabled",
               title: "Un dossier PAQ est déjà en cours" };
    }
    if (!hasSixMonthsPassed(collab)) {
      const days = daysUntilPaq(collab);
      return {
        label: days != null ? `Créer PAQ (${days}j)` : "Créer PAQ",
        disabled: true,
        className: "action-btn btn-paq btn-paq-disabled",
        title: `PAQ disponible dans ${days ?? "?"} jour(s)`,
      };
    }
    return { label: "Créer PAQ", disabled: false,
             className: "action-btn btn-paq",
             title: "Créer le dossier PAQ" };
  };

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filteredCollaborators = useMemo(() => {
    const s = search.toLowerCase().trim();
    const latestMatricule = location.state?.newCollaborator?.matricule || sessionStorage.getItem("latest_collaborator_matricule");

    const filtered = collaborators.filter((c) => {
      if (!s) return true;
      return (
        (c.matricule && c.matricule.toLowerCase().includes(s)) ||
        (c.nom       && c.nom.toLowerCase().includes(s))       ||
        (c.prenom    && c.prenom.toLowerCase().includes(s))    ||
        (c.segment   && c.segment.toLowerCase().includes(s))
      );
    });

    return sortCollaborators(filtered, latestMatricule, sortMode);
  }, [collaborators, search, sortMode, location.state]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getStatusBadgeClass = (niveau, statut) => {
    const s = (statut || "").toUpperCase();
    if (s === "ARCHIVE") return "badge-soft-dark";
    if (s === "POSITIF") return "badge-soft-success";
    if (niveau === 1)    return "badge-soft-info";
    if (niveau === 2)    return "badge-soft-warning";
    if (niveau >= 3)     return "badge-soft-danger";
    return "badge-soft-secondary";
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; }
  };

  const getCurrentPaqLevel = (c) =>
    c.niveau !== undefined && c.niveau !== null ? c.niveau : 0;

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="container py-4 collab-page">

      {/* Topbar */}
      <div className="collab-topbar">
        <div className="collab-title">Gestion Collaborateurs</div>
        <button
          type="button"
          onClick={() => navigate("/add-collaborator")}
          className="btn btn-primary btn-sm"
        >
          Ajouter Collaborateur
        </button>
      </div>

      {/* Recherche */}
      <div className="collab-search mb-4">
        <div className="collab-toolbar">
        <div className="input-group collab-search-group">
          <span className="input-group-text"><i className="fas fa-search"></i></span>
          <input
            type="text"
            className="form-control"
            placeholder="Rechercher par matricule, nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="btn btn-outline-secondary" onClick={() => setSearch("")}>✕</button>
          )}
        </div>
        <div className="collab-filter-box">
          <label htmlFor="collab-sort" className="collab-filter-label">Tri</label>
          <select
            id="collab-sort"
            className="form-select collab-filter-select"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
          >
            <option value="latest_added">Dernier ajoute en premier</option>
            <option value="hire_date">Date embauche recente</option>
            <option value="matricule">Matricule</option>
          </select>
        </div>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Chargement des collaborateurs...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center">
          {error}
          <button className="btn btn-link" onClick={loadCollaborators}>Réessayer</button>
        </div>
      ) : filteredCollaborators.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">Aucun collaborateur trouvé</p>
          {search && (
            <button className="btn btn-outline-secondary" onClick={() => setSearch("")}>
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>MATRICULE</th>
                <th>NOM & PRÉNOM</th>
                <th>SEGMENT</th>
                <th>DATE EMBAUCHE</th>
                <th>NIVEAU PAQ</th>
                <th>DERNIÈRE FAUTE</th>
                <th>STATUT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollaborators.map((c) => {
                const level       = getCurrentPaqLevel(c);
                const creerConfig = getCreerPaqConfig(c);

                return (
                  <tr key={c.matricule}>
                    <td className="matricule-cell">{c.matricule}</td>
                    <td className="name-cell">{c.nom} {c.prenom}</td>
                    <td className="segment-cell">{c.segment}</td>
                    <td className="date-cell">{formatDate(c.hireDate)}</td>
                    <td className="niveau-cell">
                      <div className="niveau-stack">
                        {[0,1,2,3,4,5].map(n => (
                          <span key={n}
                            className={`niveau-pill n${n} ${level === n ? "active" : ""}`}
                            title={`Niveau ${n}`}
                          >N{n}</span>
                        ))}
                      </div>
                    </td>
                    <td className="faute-cell">
                      {c.derniereFaute
                        ? <span className="text-danger">{formatDate(c.derniereFaute)}</span>
                        : <span className="text-muted">Aucune</span>}
                    </td>
                    <td className="statut-cell">
                      <span className={`badge-custom ${getStatusBadgeClass(c.niveau, c.statut)}`}>
                        {c.statut || "N/A"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="actions-group">

                        {/* ── 1. Voir PAQ ─ toujours cliquable ── */}
                        <button
                          className="action-btn btn-view"
                          onClick={() => navigate(`/paq-dossier/${c.matricule}`)}
                          title="Consulter le dossier PAQ"
                        >
                          Voir PAQ
                        </button>

                        {/* ── 2. Modifier ── */}
                        <button
                          className="action-btn btn-edit"
                          onClick={() =>
                            navigate(`/edit-collaborator/${c.matricule}`, {
                              state: { collaborator: c },
                            })
                          }
                          title="Modifier le collaborateur"
                        >
                          Modifier
                        </button>

                        

                        {/* ── 4. Supprimer ── */}
                        <button
                          className="action-btn btn-delete"
                          onClick={() => deleteCollaborator(c.matricule, `${c.nom} ${c.prenom}`)}
                          title="Supprimer le collaborateur"
                        >
                          Supprimer
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}   