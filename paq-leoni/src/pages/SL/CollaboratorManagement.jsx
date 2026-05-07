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

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await collaboratorService.getAll();
      let data = Array.isArray(response.data) ? response.data : response.data?.data || [];

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

  const deleteCollaborator = async (matricule, fullName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${fullName} ?`)) return;
    try {
      await collaboratorService.delete(matricule);
      setCollaborators(prev => prev.filter(c => c.matricule !== matricule));
    } catch {
      alert("Erreur lors de la suppression du collaborateur");
    }
  };

  /** true si 6 mois d'ancienneté sont atteints */
  const hasSixMonthsPassed = (collab) => {
    if (!collab?.hireDate) return false;
    const limit = new Date(collab.hireDate);
    limit.setMonth(limit.getMonth() + 6);
    return new Date() >= limit;
  };

  /** Vérifie si un PAQ actif existe pour ce collaborateur */
  const hasActivePaq = (collab) => {
    // Si le collaborateur a un niveau > 0 ou un statut différent de POSITIF, il a un PAQ
    const s = (collab.statut || "").toUpperCase();
    return s !== "POSITIF" && s !== "N/A" && collab.niveau !== undefined && collab.niveau !== null;
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; }
  };

  const getStatusBadgeClass = (statut, niveau) => {
    const s = (statut || "").toUpperCase();
    if (s === "ARCHIVE") return "badge-soft-dark";
    if (s === "POSITIF") return "badge-soft-success";
    if (s === "CLOTURE") return "badge-soft-info";
    if (niveau === 1)    return "badge-soft-info";
    if (niveau === 2)    return "badge-soft-warning";
    if (niveau >= 3)     return "badge-soft-danger";
    return "badge-soft-secondary";
  };

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

  return (
    <div className="container py-4 collab-page">

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
              <option value="latest_added">Dernier ajouté en premier</option>
              <option value="hire_date">Date embauche récente</option>
              <option value="matricule">Matricule</option>
            </select>
          </div>
        </div>
      </div>

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
                const sixMonthsPassed = hasSixMonthsPassed(c);
                const hasPaq = hasActivePaq(c);
                
                // Déterminer l'affichage du bouton PAQ
                let paqButton = null;
                if (hasPaq) {
                  paqButton = (
                    <button
                      className="action-btn btn-view"
                      onClick={() => navigate(`/paq-dossier/${c.matricule}`)}
                      title="Consulter le dossier PAQ"
                    >
                      Voir PAQ
                    </button>
                  );
                } else if (sixMonthsPassed) {
                  paqButton = (
                    <button
                      className="action-btn btn-paq"
                      onClick={() => navigate(`/paq-dossier/${c.matricule}`)}
                      title="Créer le dossier PAQ"
                    >
                      Créer PAQ
                    </button>
                  );
                } else {
                  paqButton = (
                    <button
                      className="action-btn btn-paq-disabled"
                      disabled
                      title={`PAQ disponible après 6 mois d'ancienneté (${formatDate(c.hireDate)})`}
                    >
                      Créer PAQ
                    </button>
                  );
                }

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
                            className={`niveau-pill n${n} ${c.niveau === n ? "active" : ""}`}
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
                      <span className={`badge-custom ${getStatusBadgeClass(c.statut, c.niveau)}`}>
                        {c.statut || "N/A"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="actions-group">
                        {/* Bouton PAQ (Créer ou Voir selon situation) */}
                        {paqButton}

                        {/* Bouton Modifier */}
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

                        {/* Bouton Supprimer */}
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