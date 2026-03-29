import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collaboratorService, paqService } from "../../services/api";
import "../../styles/collaborator.css";

export default function CollaboratorManagement() {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadCollaborators();
  }, []);

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await collaboratorService.getAll();
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      // Trier les collaborateurs par date d'ajout (nouveau en premier)
      data.sort((a, b) => new Date(b.hireDate) - new Date(a.hireDate));
      setCollaborators(data);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      setError("Impossible de charger la liste des collaborateurs");
    } finally {
      setLoading(false);
    }
  };

  const addCollaboratorToList = (newCollaborator) => {
    // Ajouter en tête de la liste
    setCollaborators(prev => [newCollaborator, ...prev]);
  };

  const deleteCollaborator = async (matricule, name) => {
    if (window.confirm(`Etes-vous sur de vouloir supprimer ${name} ?`)) {
      try {
        await collaboratorService.delete(matricule);
        setCollaborators(prev => prev.filter(c => c.matricule !== matricule));
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression du collaborateur");
      }
    }
  };

  const canCreatePaq = (collab) => {
    if (!collab?.hireDate) return false;
    const hireDate = new Date(collab.hireDate);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return hireDate <= sixMonthsAgo;
  };

  const createPaq = async (collab) => {
    try {
      if (collab?.statut && collab.statut !== "POSITIF") {
        navigate(`/paq-dossier/${collab.matricule}`);
        return;
      }
      if (!canCreatePaq(collab)) {
        alert("PAQ disponible apres 6 mois d'anciennete.");
        return;
      }
      const response = await paqService.create(collab.matricule);
      if (response.data) {
        alert(`Dossier PAQ cree avec succes pour ${collab.nom} ${collab.prenom} !`);
        // Ajouter le collaborateur avec PAQ mis à jour en tête
        const updatedCollab = { ...collab, statut: response.data.statut };
        addCollaboratorToList(updatedCollab);
        navigate(`/paq-dossier/${collab.matricule}`);
      } else {
        alert("Impossible de creer le PAQ : moins de 6 mois d'anciennete requis");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Erreur serveur lors de la creation du PAQ";
      const normalized = errorMsg
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (normalized.includes("existe deja")) {
        navigate(`/paq-dossier/${collab.matricule}`);
        return;
      }
      console.error("Erreur lors de la creation du PAQ:", error);
      alert(errorMsg);
    }
  };

  const filteredCollaborators = collaborators.filter((c) => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return true;
    return (
      (c.matricule && c.matricule.toLowerCase().includes(searchLower)) ||
      (c.nom && c.nom.toLowerCase().includes(searchLower)) ||
      (c.prenom && c.prenom.toLowerCase().includes(searchLower)) ||
      (c.segment && c.segment.toLowerCase().includes(searchLower))
    );
  });

  const levelCounts = useMemo(() => {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    collaborators.forEach((c) => {
      const n = Number(c.niveau ?? 0);
      if (!Number.isNaN(n) && n >= 0 && n <= 5) counts[n] += 1;
    });
    return counts;
  }, [collaborators]);

  const getStatusBadgeClass = (niveau, statut) => {
    if (statut === "POSITIF") return "badge-soft-success";
    if (niveau === 1) return "badge-soft-info";
    if (niveau === 2) return "badge-soft-warning";
    if (niveau >= 3) return "badge-soft-danger";
    return "badge-soft-secondary";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container py-4 collab-page">
      {/* Topbar */}
      <div className="collab-topbar">
        <div className="collab-title">Gestion Collaborateurs</div>
        <div className="collab-actions">
          <button
            type="button"
            onClick={() => navigate("/add-collaborator")}
            className="btn btn-primary btn-sm"
          >
            + Nouveau
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="collab-stats mb-4">
        <div className="stat-card stat-total">
          <div className="stat-value">{collaborators.length}</div>
          <div className="stat-label">Total</div>
        </div>
        {[0, 1, 2, 3, 4, 5].map(n => (
          <div key={n} className={`stat-card stat-l${n}`}>
            <div className="stat-value">{levelCounts[n]}</div>
            <div className="stat-label">Niveau {n}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="collab-search mb-4">
        <div className="input-group collab-search-group">
          <span className="input-group-text">
            <i className="fas fa-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Matricule, nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Chargement des collaborateurs...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center">
          {error}
          <button className="btn btn-link" onClick={loadCollaborators}>
            Reessayer
          </button>
        </div>
      ) : filteredCollaborators.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">Aucun collaborateur trouve</p>
          {search && (
            <button className="btn btn-outline-secondary" onClick={() => setSearch("")}>
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="card collab-table-card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Nom & Prenom</th>
                    <th>Segment</th>
                    <th>Date embauche</th>
                    <th>Niveau PAQ</th>
                    <th>Derniere faute</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollaborators.map((c) => (
                    <tr key={c.matricule}>
                      <td className="fw-semibold">{c.matricule}</td>
                      <td>{c.nom} {c.prenom}</td>
                      <td>{c.segment}</td>
                      <td>{formatDate(c.hireDate)}</td>
                      <td>
                        <div className="niveau-stack">
                          {[0, 1, 2, 3, 4].map((n) => (
                            <span
                              key={n}
                              className={`niveau-pill n${n} ${c.niveau === n ? "active" : ""}`}
                              title={`Niveau ${n}`}
                            >N{n}</span>
                          ))}
                        </div>
                      </td>
                      <td>{c.derniereFaute ? <span className="text-danger">{formatDate(c.derniereFaute)}</span> : <span className="text-success">Aucune (6 mois)</span>}</td>
                      <td><span className={`badge ${getStatusBadgeClass(c.niveau, c.statut)}`}>{c.statut || "N/A"}</span></td>
                      <td>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-light" onClick={() => navigate(`/paq-dossier/${c.matricule}`)}>Voir dossier PAQ</button>
                          <button className="btn btn-sm btn-outline-warning" onClick={() => navigate(`/edit-collaborator/${c.matricule}`, { state: { collaborator: c } })}>Modifier</button>
                          <button className="btn btn-sm btn-outline-success" onClick={() => createPaq(c)} disabled={!canCreatePaq(c)} title={!canCreatePaq(c) ? "Necessite 6 mois d'anciennete" : ""}>Creer PAQ (6 mois)</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCollaborator(c.matricule, `${c.nom} ${c.prenom}`)}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}