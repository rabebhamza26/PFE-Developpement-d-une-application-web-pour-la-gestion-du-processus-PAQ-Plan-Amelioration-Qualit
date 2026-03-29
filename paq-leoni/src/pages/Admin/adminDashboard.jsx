import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { dashboardService, userService, getSegments } from "../../services/api";
import UsersManagement from "./UsersManagement";
import SegmentManagement from "./SegmentManagement";
import "../../styles/admin-dashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeView, setActiveView] = useState("stats");
  const roleOrder = [
    "ADMIN",
    "SL",
    "QM_SEGMENT",
    "QM_PLANT",
    "SGL",
    "HP",
    "RH",
    "COORDINATEUR_FORMATION",
  ];

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (location.pathname === "/admin/users") {
      setActiveView("users");
    } else if (location.pathname === "/admin/segments") {
      setActiveView("segments");
    } else {
      setActiveView("stats");
    }
  }, [location.pathname]);

  const loadStats = async () => {
    try {
      const [usersRes, segmentsRes] = await Promise.all([
        userService.getAllUsers(),
        getSegments()
      ]);
      const users = usersRes.data || [];
      const segments = segmentsRes.data || [];

      const roleCounts = users.reduce((acc, user) => {
        const role = user.role || "UNKNOWN";
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      const activeUsers = users.filter((user) => user.active).length;
      const inactiveUsers = users.length - activeUsers;

      setStats({
        totalUsers: users.length,
        activeUsers,
        inactiveUsers,
        totalSegments: segments.length,
        roleCounts
      });
    } catch (error) {
      try {
        const res = await dashboardService.getStats();
        setStats(res.data);
      } catch (fallbackError) {
        console.error("Erreur lors du chargement des statistiques:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const roleCounts = stats.roleCounts || stats.roles || {};
  const totalRoleUsers = Object.values(roleCounts).reduce((acc, v) => acc + Number(v || 0), 0);
  const totalUsers = stats.totalUsers ?? totalRoleUsers ?? 0;
  const activeUsers = stats.activeUsers ?? 0;
  const inactiveUsers =
    stats.inactiveUsers ?? Math.max(0, Number(totalUsers || 0) - Number(activeUsers || 0));

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div>
          <div className="admin-title">Tableau de bord</div>
          <div className="admin-subtitle">Vue d'ensemble de la plateforme</div>
        </div>
        <div className="admin-topbar-actions">
          <div className="admin-search">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Rechercher..." />
          </div>
          <div className="admin-user">
            <div className="admin-avatar">SA</div>
            <div>
              <div className="admin-user-name">System Admin</div>
              <div className="admin-user-role">Administrateur</div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-hero">
        <div>
          <div className="hero-kicker">Systeme Operationnel - Administration PAQ</div>
          <h2>Bonjour, System</h2>
          <p>Plateforme PAQ Leoni - vue d'ensemble administrative.</p>
        </div>
        
      </div>

      {activeView === "users" && <UsersManagement />}
      {activeView === "segments" && <SegmentManagement />}

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
            </div>

            <div className="admin-panels">
              <div className="panel-card">
                <div className="panel-header">
                  <h3>Repartition par role</h3>
                  <span className="panel-subtitle">{roleOrder.length} roles actifs</span>
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
            </div>
          </>
        )
      )}
    </div>
  );
}
