// adminDashboard.jsx - Version corrigée (Hooks en premier)
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { dashboardService, userService, getSegments, siteService, plantService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import UsersManagement from "./UsersManagement";
import SegmentManagement from "./SegmentManagement";
import SitesManagement from "./SitesManagement";
import PlantManagement from "./PlantManagement";
import "../../styles/admin-dashboard.css";

export default function AdminDashboard() {
  // ✅ TOUS LES HOOKS D'ABORD (avant tout return conditionnel)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalSegments: 0,
    totalSites: 0,
    totalPlants: 0,
    roleCounts: {}
  });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const [activeView, setActiveView] = useState("stats");
  const { user, logout } = useAuth();
  const [usersBySite, setUsersBySite] = useState([]);
  
  const roleOrder = [
    "ADMIN",
    "SL",
    "QM_SEGMENT",
    "QM_PLANT",
    "SGL",
    "HP",
    "RH",
  ];

  // ✅ useMemo AVANT tout return conditionnel
  const timeLabel = useMemo(
    () => now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    [now]
  );
  
  const dateLabel = useMemo(
    () => now.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }),
    [now]
  );

  // Fonction pour charger toutes les données
  const loadAllData = async () => {
    setLoading(true);
    try {
      console.log("Chargement des données...");
      
      const [sitesRes, plantsRes, usersRes, segmentsRes, usersBySiteRes] = await Promise.all([
        siteService.getAll().catch(err => {
          console.warn("Erreur chargement sites:", err?.message);
          return { data: [] };
        }),
        plantService.getAll().catch(err => {
          console.warn("Erreur chargement plants:", err?.message);
          return { data: [] };
        }),
        userService.getAllUsers().catch(err => {
          console.warn("Erreur chargement users:", err?.message);
          return { data: [] };
        }),
        getSegments().catch(err => {
          console.warn("Erreur chargement segments:", err?.message);
          return { data: [] };
        }),
        userService.getUsersBySite().catch(err => {
          console.warn("Erreur chargement répartition par site:", err);
          return { data: [] };
        })
      ]);
      
      const sites = sitesRes.data || [];
      const plants = plantsRes.data || [];
      const users = usersRes.data || [];
      const segments = segmentsRes.data || [];
      setUsersBySite(usersBySiteRes.data || []);
      
      console.log("Sites chargés:", sites.length);
      console.log("Plants chargés:", plants.length);
      console.log("Utilisateurs chargés:", users.length);
      console.log("Segments chargés:", segments.length);
      
      const roleCounts = users.reduce((acc, user) => {
        const role = user.role || "UNKNOWN";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});
      
      const activeUsers = users.filter((user) => user.active).length;
      const inactiveUsers = users.length - activeUsers;
      
      const newStats = {
        totalUsers: users.length,
        activeUsers: activeUsers,
        inactiveUsers: inactiveUsers,
        totalSegments: segments.length,
        totalSites: sites.length,
        totalPlants: plants.length,
        roleCounts: roleCounts
      };
      
      console.log("Statistiques calculées:", newStats);
      setStats(newStats);
      
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Tous les useEffect AVANT tout return conditionnel
  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (location.pathname === "/admin/users") {
      setActiveView("users");
    } else if (location.pathname === "/admin/segments") {
      setActiveView("segments");
    } else if (location.pathname === "/admin/sites") {
      setActiveView("sites");
    } else if (location.pathname === "/admin/plants") {
      setActiveView("plants");
    } else {
      setActiveView("stats");
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      const API = (await import("../../services/api")).default;
      await API.post("/api/auth/logout");
    } catch (err) {
      console.warn("Logout backend echoue:", err?.message || err);
    } finally {
      logout();
      window.location.href = "/";
    }
  };

  // ✅ Calcul des variables DERRIÈRE tous les Hooks
  const isAdmin = user?.role === "ADMIN" || user?.role === "admin";
  const roleCounts = stats.roleCounts || {};
  const totalRoleUsers = Object.values(roleCounts).reduce((acc, v) => acc + Number(v || 0), 0);
  const totalUsers = stats.totalUsers || 0;
  const activeUsers = stats.activeUsers || 0;
  const inactiveUsers = stats.inactiveUsers || 0;
  const displayName = user?.fullName || user?.login || "System Admin";
  const displayRole = user?.role || "ADMIN";

  // ✅ Vérification du rôle APRÈS tous les Hooks
  if (!isAdmin) {
    return (
      <div className="admin-shell">
        <div className="admin-topbar">
          <div className="admin-title">Accès refusé</div>
        </div>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>⛔ Accès non autorisé</h2>
          <p>Vous n'avez pas les droits d'administration.</p>
          <button onClick={() => navigate("/dashboard")} className="btn btn-primary">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // ✅ Le return principal APRÈS la vérification
  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div>
          <div className="admin-title">Tableau de bord</div>
        </div>
        <div className="admin-topbar-actions">
          <div className="admin-user">
            <div>
              <div className="admin-user-name">{displayName}</div>
              <div className="admin-user-role">{displayRole}</div>
            </div>
          </div>
          <button type="button" className="admin-topbar-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      <div className="admin-hero admin-hero-compact">
        <div>
          <h2>Bonjour, {displayName}</h2>
        </div>
        <div className="hero-clock">
          <div className="clock-label">Heure locale</div>
          <div className="clock-time">{timeLabel}</div>
          <div className="clock-date">{dateLabel}</div>
        </div>
      </div>

      {activeView === "users" && <UsersManagement />}
      {activeView === "segments" && <SegmentManagement />}
      {activeView === "sites" && <SitesManagement />}
      {activeView === "plants" && <PlantManagement />}

      {activeView === "stats" && (
        loading ? (
          <div className="admin-loading">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="admin-kpis">
              <div className="kpi-card">
                <div className="kpi-label">Total utilisateurs</div>
                <div className="kpi-value">{totalUsers || 0}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Comptes actifs</div>
                <div className="kpi-value">{activeUsers || 0}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Comptes inactifs</div>
                <div className="kpi-value">{inactiveUsers || 0}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Total segments</div>
                <div className="kpi-value">{stats.totalSegments || 0}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Total sites</div>
                <div className="kpi-value">{stats.totalSites || 0}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Total plants</div>
                <div className="kpi-value">{stats.totalPlants || 0}</div>
              </div>
            </div>

            <div className="admin-panels-grid">
              <div className="panel-card">
                <div className="panel-header">
                  <h3>Répartition par rôle</h3>
                  <span className="panel-subtitle">{roleOrder.length} rôles actifs</span>
                </div>
                <div className="panel-body">
                  {roleOrder.map((role) => {
                    const count = Number(roleCounts[role] || 0);
                    const pct = totalRoleUsers > 0 ? Math.round((count / totalRoleUsers) * 100) : 0;
                    return (
                      <div className="role-row" key={role}>
                        <div className="role-label">{role}</div>
                        <div className="role-bar"><span style={{ width: `${pct}%` }} /></div>
                        <div className="role-percent">{pct}%</div>
                        <div className="role-count">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="panel-card">
                <div className="panel-header">
                  <h3>Répartition des utilisateurs par site</h3>
                  <span className="panel-subtitle">Liste des sites</span>
                </div>
                <div className="panel-body">
                  {usersBySite && usersBySite.length > 0 ? (
                    usersBySite.map((site) => {
                      const pct = totalUsers > 0 ? Math.round((site.userCount / totalUsers) * 100) : 0;
                      return (
                        <div className="role-row" key={site.siteId}>
                          <div className="role-label">{site.siteName}</div>
                          <div className="role-bar"><span style={{ width: `${pct}%` }} /></div>
                          <div className="role-percent">{site.userCount} users</div>
                          <div className="role-count">{pct}%</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-data-message" style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                      Aucune donnée disponible
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}