import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { userService, siteService, plantService, getSegments } from "../../services/api";
import API from "../../services/api"; 

import "../../styles/UsersManagement.css";
import {
  showConfirmAlert,
  showErrorAlert,
  showPasswordPrompt,
  showSuccessAlert,
  showSuccessToast,
} from "../../utils/entretienAlerts";


export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sites, setSites] = useState([]);
  const [plants, setPlants] = useState([]);
  const [segments, setSegments] = useState([]);
  const [filterSite, setFilterSite] = useState("");
  const [filterPlant, setFilterPlant] = useState("");
  const [filterSegment, setFilterSegment] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState([]);
  // Stocke { userId: { password, timestamp } } en mémoire
  const [passwordLog, setPasswordLog] = useState({});

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
  const state = location.state;

  if (state?.newUserPassword && state?.userId) {
    setPasswordLog(prev => ({
      ...prev,
      [state.userId]: {
        password: state.newUserPassword,
        at: new Date().toLocaleTimeString()
      }
    }));
  }

  if (state?.updatedPassword && state?.userId) {
    setPasswordLog(prev => ({
      ...prev,
      [state.userId]: {
        password: state.updatedPassword,
        at: new Date().toLocaleTimeString()
      }
    }));
  }

}, [location.state]);

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("access_token");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== "ADMIN") {
        setError("Accès non autorisé.");
        setTimeout(() => navigate("/dashboard"), 3000);
      }
    }
  }, [navigate]);

  useEffect(() => {
    loadUsers();
    loadSitesAndPlantsAndSegments();
    loadRoles();
  }, [location.key]);

  useEffect(() => {
    applyFilters();
  }, [users, filterSite, filterPlant, filterSegment, filterRole, searchTerm]);

  const loadSitesAndPlantsAndSegments = async () => {
    try {
      const [sitesRes, plantsRes, segmentsRes] = await Promise.all([
        siteService.getAll(),
        plantService.getAll(),
        getSegments()
      ]);
      setSites(sitesRes.data || []);
      setPlants(plantsRes.data || []);
      setSegments(segmentsRes.data || []);
    } catch (err) {
      console.error("Erreur chargement:", err);
    }
  };

  const loadRoles = () => {
    setRoles([
      { value: "ADMIN", label: "Administrateur" },
      { value: "SL", label: "SL" },
      { value: "QM_SEGMENT", label: "QM Segment" },
      { value: "QM_PLANT", label: "QM Plant" },
      { value: "SGL", label: "SGL" },
      { value: "HP", label: "HP" },
      { value: "RH", label: "RH" },
    ]);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await userService.getAllUsers();
      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Accès non autorisé.");
        setTimeout(() => navigate("/dashboard"), 3000);
      } else {
        setError("Erreur lors du chargement: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    if (filterSite) filtered = filtered.filter(u => u.siteIds?.includes(parseInt(filterSite)));
    if (filterPlant) filtered = filtered.filter(u => u.plantIds?.includes(parseInt(filterPlant)));
    if (filterSegment) filtered = filtered.filter(u => u.segmentIds?.includes(parseInt(filterSegment)));
    if (filterRole) filtered = filtered.filter(u => u.role === filterRole);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.nomUtilisateur?.toLowerCase().includes(term) ||
        u.login?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }
    setFilteredUsers(filtered);
  };

  const deleteUser = async (id) => {
    const result = await showConfirmAlert({
      title: "Supprimer cet utilisateur ?",
      text: "Cette action est irreversible.",
      confirmButtonText: "Supprimer",
    });
    if (!result.isConfirmed) return;

    try {
      await userService.deleteUser(id);
      // Nettoyer le log de mot de passe
      setPasswordLog(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await showSuccessAlert("Utilisateur supprime", "Le compte a bien ete supprime.");
      loadUsers();
    } catch (err) {
      const message = "Erreur suppression: " + (err.response?.data?.message || err.message);
      setError(message);
      await showErrorAlert("Suppression impossible", message);
    }
  };

  const getPlantsBySite = (siteId) => {
    if (!siteId) return plants;
    return plants.filter(p => p.siteId === parseInt(siteId));
  };

  const resetFilters = () => {
    setFilterSite(""); setFilterPlant(""); setFilterSegment(""); setFilterRole(""); setSearchTerm("");
  };

  const getRoleBadgeClass = (role) => {
    const map = { ADMIN: 'role-badge-admin', RH: 'role-badge-rh', SGL: 'role-badge-sgl', SL: 'role-badge-sl', QM_SEGMENT: 'role-badge-qm-segment', QM_PLANT: 'role-badge-qm-plant', HP: 'role-badge-hp' };
    return map[role] || 'role-badge-default';
  };

  const getRoleLabel = (role) => roles.find(r => r.value === role)?.label || role;

  const resetUserPassword = async (userId) => {
    const promptResult = await showPasswordPrompt();
    if (!promptResult.isConfirmed) return;

    const newPassword = promptResult.value?.trim();

    try {
      const response = await userService.resetPasswordByAdmin(userId, newPassword);
      if (response.data.success) {
        // Stocker le mot de passe affiche dans le tableau
        setPasswordLog(prev => ({
          ...prev,
          [userId]: { password: newPassword, at: new Date().toLocaleTimeString() }
        }));
        await showSuccessAlert("Mot de passe reinitialise", "L'utilisateur doit se reconnecter.");
        loadUsers();
      } else {
        await showErrorAlert("Reinitialisation impossible", response.data.message || "Une erreur est survenue.");
      }
    } catch (err) {
      let msg = "Erreur: ";
      if (err.response?.status === 403) msg += "Acces non autorise.";
      else msg += err.response?.data?.message || err.message;
      await showErrorAlert("Reinitialisation impossible", msg);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userService.toggleActive(user.id);
      await showSuccessToast(
        user.active ? "Utilisateur desactive" : "Utilisateur active",
        user.nomUtilisateur || user.login || ""
      );
      loadUsers();
    } catch (err) {
      await showErrorAlert(
        "Mise a jour impossible",
        err.response?.data?.message || err.message || "Une erreur est survenue."
      );
    }
  };

  // Affiche ou masque le mot de passe
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <div className="users-management-container">
      <div className="header-container">
        <div className="header-content">
          <h1 className="header-title">Gestion des utilisateurs</h1>
        </div>
      </div>

      <div className="add-user-wrapper">
        <button onClick={() => navigate("/admin/add-user")} className="btn-add-user">
          <span>Ajouter un utilisateur</span>
        </button>
      </div>
      <br />

      {/* Filtres */}
      <div className="filters-card">
        <div className="filters-header">
          {(filterSite || filterPlant || filterSegment || filterRole || searchTerm) && (
            <button onClick={resetFilters} className="btn-reset-filters">Réinitialiser</button>
          )}
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Recherche</label>
            <input type="text" className="filter-input" placeholder="Nom, login ou email..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="filter-group">
            <label className="filter-label">Site</label>
            <select className="filter-select" value={filterSite}
              onChange={e => { setFilterSite(e.target.value); setFilterPlant(""); }}>
              <option value="">Tous les sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Plant</label>
            <select className="filter-select" value={filterPlant}
              onChange={e => setFilterPlant(e.target.value)} disabled={!filterSite}>
              <option value="">Tous les plants</option>
              {getPlantsBySite(filterSite).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Segment</label>
            <select className="filter-select" value={filterSegment} onChange={e => setFilterSegment(e.target.value)}>
              <option value="">Tous les segments</option>
              {segments.map(s => <option key={s.id} value={s.id}>{s.nomSegment}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Rôle</label>
            <select className="filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="">Tous les rôles</option>
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>Aucun utilisateur trouvé</p>
          <button onClick={resetFilters}>Réinitialiser les filtres</button>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-header-info">
            <span>{filteredUsers.length} utilisateur(s)</span>
            <span>Actifs: {filteredUsers.filter(u => u.active).length}</span>
            <span>Inactifs: {filteredUsers.filter(u => !u.active).length}</span>
          </div>

          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Utilisateur</th>
                  <th>Login</th>
                  <th>Email</th>
                  <th>Sites</th>
                  <th>Plants</th>
                  <th>Segments</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Mot de passe </th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.nomUtilisateur}</td>
                    <td>{user.login}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.siteNames?.length > 0
                        ? user.siteNames.map((n, i) => <span key={i} className="badge-site">{n}</span>)
                        : <span className="text-gray">—</span>}
                    </td>
                    <td>
                      {user.plantNames?.length > 0
                        ? user.plantNames.map((n, i) => <span key={i} className="badge-plant">{n}</span>)
                        : <span className="text-gray">—</span>}
                    </td>
                    <td>
                      {user.segmentNames?.length > 0
                        ? user.segmentNames.map((n, i) => <span key={i} className="badge-segment">{n}</span>)
                        : <span className="text-gray">—</span>}
                    </td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.active ? 'status-active' : 'status-inactive'}`}>
                        {user.active ? "Actif" : "Inactif"}
                      </span>
                    </td>

                    {/* Colonne mot de passe temporaire */}
                    <td>
  {passwordLog[user.id] ? (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <code style={{
        background: "#fef3c7",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        color: "#92400e",
        fontWeight: "bold",
        fontFamily: "monospace"
      }}>
        {passwordLog[user.id].password}
      </code>

      <small style={{ color: "#9ca3af", fontSize: "10px" }}>
        {passwordLog[user.id].at}
      </small>

      <button
        onClick={() => {
          navigator.clipboard.writeText(passwordLog[user.id].password);
          showSuccessToast("Mot de passe copie");
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#6b7280"
        }}
      >
        📋
      </button>
    </div>
  ) : (
    <span style={{ color: "#9ca3af", fontSize: "12px" }}>
*****    </span>
  )}
</td>

                    <td className="actions-cell">
                      <div className="actions-group">
                        <button onClick={() => navigate(`/admin/edit-user/${user.id}`)}
                          className="action-btn action-edit" title="Modifier">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => deleteUser(user.id)}
                          className="action-btn action-delete" title="Supprimer">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                        <button onClick={() => handleToggleActive(user)}
                          className={`action-btn ${user.active ? 'action-deactivate' : 'action-activate'}`}
                          title={user.active ? "Désactiver" : "Activer"}>
                          <i className={`fas ${user.active ? 'fa-ban' : 'fa-check-circle'}`}></i>
                        </button>
                        <button onClick={() => resetUserPassword(user.id)}
                          className="action-btn action-reset" title="Réinitialiser le mot de passe">
                          <i className="fas fa-key"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}