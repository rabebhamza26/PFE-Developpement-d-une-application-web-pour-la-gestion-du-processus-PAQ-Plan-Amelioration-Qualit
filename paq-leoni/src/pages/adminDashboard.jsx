import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { dashboardService } from "../services/api";
import UsersManagement from "./UsersManagement";
import SegmentManagement from "./SegmentManagement";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeView, setActiveView] = useState("stats");

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
      const res = await dashboardService.getStats();
      setStats(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-12">
          <h1 className="text-primary mb-4">
            <i className="fas fa-tachometer-alt me-2"></i>
            Dashboard Admin
          </h1>

          <div className="d-flex gap-2 mb-3">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/admin/users")}
            >
              Gérer les utilisateurs
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/admin/segments")}
            >
              Gérer les segments
            </button>
            <button
              className="btn btn-light"
              onClick={() => navigate("/admin")}
            >
              Retour dashboard
            </button>
          </div>

          {activeView === "users" && <UsersManagement />}
          {activeView === "segments" && <SegmentManagement />}

          {activeView === "stats" && (loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <div className="card bg-primary text-white h-100">
                    <div className="card-body text-center">
                      <i className="fas fa-users fa-2x mb-2"></i>
                      <h4>{stats.totalUsers || 0}</h4>
                      <p className="mb-0">Utilisateurs</p>
                    </div>
                  </div>
                </div>
                
               
              </div>

              
            </>
          ))}
        </div>
      </div>
    </div>
  );
}


