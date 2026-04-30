// UsersManagement.jsx - Version améliorée avec styles modernes
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { userService, siteService, plantService, getSegments } from "../../services/api";
import "../../styles/UsersManagement.css";

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
  
  const navigate = useNavigate();
  const location = useLocation();

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

  const loadRoles = async () => {
    try {
      const rolesFromDb = [
        { value: "ADMIN", label: "Administrateur", icon: "fa-crown", color: "#ef4444" },
        { value: "SL", label: "Super Line Leader", icon: "fa-chart-line", color: "#06b6d4" },
        { value: "QM_SEGMENT", label: "QM Segment", icon: "fa-clipboard-list", color: "#14b8a6" },
        { value: "QM_PLANT", label: "QM Plant", icon: "fa-factory", color: "#10b981" },
        { value: "SGL", label: "SGL", icon: "fa-users", color: "#3b82f6" },
        { value: "HP", label: "HP", icon: "fa-handshake", color: "#f59e0b" },
        { value: "RH", label: "RH", icon: "fa-user-tie", color: "#8b5cf6" },
        { value: "COORDINATEUR_FORMATION", label: "Coordinateur Formation", icon: "fa-graduation-cap", color: "#ec4899" },
      ];
      setRoles(rolesFromDb);
    } catch (err) {
      console.error("Erreur chargement rôles:", err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await userService.getAllUsers();
      const data = Array.isArray(res.data) ? res.data : (res.data?.users || res.data?.data || []);
      setUsers(data);
    } catch (err) {
      console.error("Erreur:", err);
      if (err.response?.status === 403) {
        setError("Accès non autorisé. Seul l'administrateur peut voir cette page.");
        setTimeout(() => navigate("/dashboard"), 3000);
      } else {
        setError("Erreur lors du chargement des utilisateurs: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    
    if (filterSite) {
      filtered = filtered.filter(user => user.siteIds && user.siteIds.includes(parseInt(filterSite)));
    }
    
    if (filterPlant) {
      filtered = filtered.filter(user => user.plantIds && user.plantIds.includes(parseInt(filterPlant)));
    }
    
    if (filterSegment) {
      filtered = filtered.filter(user => user.segmentIds && user.segmentIds.includes(parseInt(filterSegment)));
    }
    
    if (filterRole) {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.nomUtilisateur?.toLowerCase().includes(term) ||
        user.login?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    }
    
    setFilteredUsers(filtered);
  };

  const deleteUser = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await userService.deleteUser(id);
        loadUsers();
      } catch (err) {
        setError("Erreur lors de la suppression: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const getPlantsBySite = (siteId) => {
    if (!siteId) return plants;
    const siteIdNum = parseInt(siteId);
    return plants.filter(plant => plant.siteId === siteIdNum);
  };

  const resetFilters = () => {
    setFilterSite("");
    setFilterPlant("");
    setFilterSegment("");
    setFilterRole("");
    setSearchTerm("");
  };

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      'ADMIN': 'role-badge-admin',
      'RH': 'role-badge-rh',
      'SGL': 'role-badge-sgl',
      'SL': 'role-badge-sl',
      'QM_SEGMENT': 'role-badge-qm-segment',
      'QM_PLANT': 'role-badge-qm-plant',
      'HP': 'role-badge-hp',
      'COORDINATEUR_FORMATION': 'role-badge-coord',
    };
    return roleMap[role] || 'role-badge-default';
  };

  const getRoleLabel = (role) => {
    const roleFound = roles.find(r => r.value === role);
    return roleFound ? roleFound.label : role;
  };

  return (
    <div className="users-management-container">
      {/* Header amélioré */}
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <div>
              <h1 className="header-title">Gestion des utilisateurs</h1>
              
            </div>
          </div>

        </div>
      </div>

      {/* Bouton Ajouter */}
      <div className="add-user-wrapper">
        <button 
          onClick={() => navigate("/admin/add-user")} 
          className="btn-add-user"
        >
          <span>Ajouter un utilisateur</span>
        </button>
      </div>
<br></br>
      {/* Barre de filtres améliorée */}
      <div className="filters-card">
        <div className="filters-header">
          
          {(filterSite || filterPlant || filterSegment || filterRole || searchTerm) && (
            <button onClick={resetFilters} className="btn-reset-filters">
              <i className="fas fa-undo-alt"></i>
              Réinitialiser
            </button>
          )}
        </div>
        
        <div className="filters-grid">
          {/* Recherche */}
          <div className="filter-group">
            <label className="filter-label">
              Recherche
            </label>
            <div className="filter-input-wrapper">
              <i className="fas fa-search filter-icon-left"></i>
              <input
                type="text"
                className="filter-input"
                placeholder="Nom, login ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="filter-clear"
                  onClick={() => setSearchTerm("")}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Filtre Site */}
          <div className="filter-group">
            <label className="filter-label">
              Site
            </label>
            <div className="filter-input-wrapper">
              <i className="fas fa-building filter-icon-left"></i>
              <select 
                className="filter-select"
                value={filterSite} 
                onChange={(e) => {
                  setFilterSite(e.target.value);
                  setFilterPlant("");
                }}
              >
                <option value="">Tous les sites</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Filtre Plant */}
          <div className="filter-group">
            <label className="filter-label">
              Plant
            </label>
            <div className="filter-input-wrapper">
              <i className="fas fa-industry filter-icon-left"></i>
              <select 
                className="filter-select"
                value={filterPlant} 
                onChange={(e) => setFilterPlant(e.target.value)}
                disabled={!filterSite}
              >
                <option value="">Tous les plants</option>
                {getPlantsBySite(filterSite).map(plant => (
                  <option key={plant.id} value={plant.id}>{plant.name}</option>
                ))}
              </select>
              {!filterSite && <small className="filter-hint"></small>}
            </div>
          </div>

          {/* Filtre Segment */}
          <div className="filter-group">
            <label className="filter-label">
              Segment
            </label>
            <div className="filter-input-wrapper">
              <i className="fas fa-tag filter-icon-left"></i>
              <select 
                className="filter-select"
                value={filterSegment} 
                onChange={(e) => setFilterSegment(e.target.value)}
              >
                <option value="">Tous les segments</option>
                {segments.map(segment => (
                  <option key={segment.id} value={segment.id}>{segment.nomSegment}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtre Rôle */}
          <div className="filter-group">
            <label className="filter-label">
              Rôle
            </label>
            <div className="filter-input-wrapper">
              <i className="fas fa-user-tag filter-icon-left"></i>
              <select 
                className="filter-select"
                value={filterRole} 
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">Tous les rôles</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="alert-error">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <button onClick={() => setError("")} className="alert-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Tableau des utilisateurs */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">Aucun utilisateur trouvé</p>
          <button onClick={resetFilters} className="empty-button">
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-header-info">
            <div className="table-stats">
              <i className="fas fa-users"></i>
              <span>{filteredUsers.length} utilisateur(s)</span>
            </div>
            <div className="table-stats">
              <i className="fas fa-check-circle text-green"></i>
              <span>Actifs: {filteredUsers.filter(u => u.active).length}</span>
            </div>
            <div className="table-stats">
              <i className="fas fa-ban text-gray"></i>
              <span>Inactifs: {filteredUsers.filter(u => !u.active).length}</span>
            </div>
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
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="user-id">{user.id}</td>
                    <td>
                      <div className="user-info">
                       
                        <span className="user-name">{user.nomUtilisateur}</span>
                      </div>
                    </td>
                    <td className="user-login">{user.login}</td>
                    <td className="user-email">{user.email}</td>
                    <td>
                      {user.siteNames && user.siteNames.length > 0 ? (
                        <div className="badge-list">
                          {user.siteNames.map((name, idx) => (
                            <span key={idx} className="badge-site">
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray">—</span>
                      )}
                    </td>
                    <td>
                      {user.plantNames && user.plantNames.length > 0 ? (
                        <div className="badge-list">
                          {user.plantNames.map((name, idx) => (
                            <span key={idx} className="badge-plant">
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray">—</span>
                      )}
                    </td>
                    <td>
                      {user.segmentNames && user.segmentNames.length > 0 ? (
                        <div className="badge-list">
                          {user.segmentNames.map((name, idx) => (
                            <span key={idx} className="badge-segment">
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.active ? 'status-active' : 'status-inactive'}`}>
                        <i className={`fas ${user.active ? 'fa-check-circle' : 'fa-ban'} me-1`}></i>
                        {user.active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="actions-group">
                        <button
                          onClick={() => navigate(`/admin/edit-user/${user.id}`)}
                          className="action-btn action-edit"
                          title="Modifier"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="action-btn action-delete"
                          title="Supprimer"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                        <button
                          onClick={async () => {
                            await userService.toggleActive(user.id);
                            loadUsers();
                          }}
                          className={`action-btn ${user.active ? 'action-deactivate' : 'action-activate'}`}
                          title={user.active ? "Désactiver" : "Activer"}
                        >
                          <i className={`fas ${user.active ? 'fa-ban' : 'fa-check-circle'}`}></i>
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