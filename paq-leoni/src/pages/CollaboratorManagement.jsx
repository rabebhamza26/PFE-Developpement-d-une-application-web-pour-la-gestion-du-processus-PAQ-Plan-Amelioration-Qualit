import React, { useEffect, useState } from "react";
import "../styles/collaborator.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function splitFullName(fullName) {
  const normalized = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!normalized) return { nom: "-", prenom: "-" };
  const parts = normalized.split(" ");
  return {
    nom: parts[0] || "-",
    prenom: parts.slice(1).join(" ") || "-",
  };
}

export default function CollaboratorManagement() {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const [niveauFilter, setNiveauFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8081/api/collaborators");
      setCollaborators(res.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des collaborateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCollab = async (matricule) => {
    if (window.confirm("Etes-vous sur de vouloir supprimer ce collaborateur ?")) {
      try {
        await axios.delete(`http://localhost:8081/api/collaborators/${matricule}`);
        load();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const getNiveau = (c) => {
    return c.niveau ?? c.niveauPaq ?? c.level ?? c.niveauActuel ?? "N/A";
  };

  const getStatus = (c) => {
    return c.statut ?? c.status ?? c.paqStatut ?? "N/A";
  };

  const segments = Array.from(
    new Set(collaborators.map((c) => c.segment).filter(Boolean))
  );

  const niveaux = Array.from(
    new Set(collaborators.map((c) => getNiveau(c)).filter(Boolean))
  );

  const statuts = Array.from(
    new Set(collaborators.map((c) => getStatus(c)).filter(Boolean))
  );

  const filtered = collaborators.filter((c) => {
    const query = search.trim().toLowerCase();
    const matchSearch =
      !query ||
      String(c.matricule || "").toLowerCase().includes(query) ||
      String(c.name || "").toLowerCase().includes(query);
    const matchSegment = segmentFilter === "ALL" || c.segment === segmentFilter;
    const matchNiveau = niveauFilter === "ALL" || String(getNiveau(c)) === String(niveauFilter);
    const matchStatus = statusFilter === "ALL" || String(getStatus(c)) === String(statusFilter);
    return matchSearch && matchSegment && matchNiveau && matchStatus;
  });

  const niveauCounts = niveaux.reduce((acc, n) => {
    acc[n] = collaborators.filter((c) => String(getNiveau(c)) === String(n)).length;
    return acc;
  }, {});

  // Nouvelle fonction : creer PAQ
  const createPaq = async (matricule) => {
    try {
      const res = await axios.post(`http://localhost:8081/api/paq?matricule=${matricule}`);
      if (!res.data) {
        alert("Impossible de creer le PAQ : moins de 6 mois ou collaborateur inexistant");
      } else {
        alert("Dossier PAQ cree avec succes !");
      }
    } catch (error) {
      console.error("Erreur lors de la creation du PAQ :", error);
      alert("Erreur serveur lors de la creation du PAQ");
    }
  };

  return (
    <div className="container py-4 collab-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <h2 className="m-0">Gestion Collaborateurs</h2>
        <button
          type="button"
          onClick={() => navigate("/add-collaborator")}
          className="btn btn-primary btn-add"
        >
          Ajouter collaborateur
        </button>
      </div>

      <div className="collab-stats mb-3">
        <div className="stat-card">
          <div className="stat-value">{collaborators.length}</div>
          <div className="stat-label">Total</div>
        </div>
        {niveaux.length === 0 ? (
          <div className="stat-card">
            <div className="stat-value">0</div>
            <div className="stat-label">N/A</div>
          </div>
        ) : (
          niveaux.slice(0, 5).map((n) => (
            <div key={n} className="stat-card">
              <div className="stat-value">{niveauCounts[n] || 0}</div>
              <div className="stat-label">Niveau {n}</div>
            </div>
          ))
        )}
      </div>

      <div className="collab-filters mb-3">
        <div className="filter-input">
          <i className="fas fa-search"></i>
          <input
            type="text"
            className="form-control"
            placeholder="Matricule, nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={segmentFilter}
          onChange={(e) => setSegmentFilter(e.target.value)}
        >
          <option value="ALL">Tous les segments</option>
          {segments.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={niveauFilter}
          onChange={(e) => setNiveauFilter(e.target.value)}
        >
          <option value="ALL">Tous les niveaux</option>
          {niveaux.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">Tous statuts</option>
          {statuts.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-center">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center">Aucun collaborateur trouve</p>
      ) : (
        <div className="card shadow-sm border-0 collab-card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Matricule</th>
                    <th>Nom</th>
                    <th>Prenom</th>
                    <th>Segment</th>
                    <th>Date d'embauche</th>
                    <th className="text-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const { nom, prenom } = splitFullName(c.name);
                    return (
                      <tr key={c.matricule}>
                        <td>{c.matricule}</td>
                        <td>{nom}</td>
                        <td>{prenom}</td>
                        <td>
                          <span className="badge text-bg-info">{c.segment}</span>
                        </td>
                        <td>{c.hireDate}</td>
                        <td className="d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              navigate(`/edit-collaborator/${c.matricule}`, { state: { collaborator: c } })
                            }
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteCollab(c.matricule)}
                          >
                            Supprimer
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() =>
                              navigate(`/paq-dossier/${c.matricule}`, { state: { collaborator: c } })
                            }
                          >
                            Dossier PAQ
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => createPaq(c.matricule)}
                          >
                            Creer PAQ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
