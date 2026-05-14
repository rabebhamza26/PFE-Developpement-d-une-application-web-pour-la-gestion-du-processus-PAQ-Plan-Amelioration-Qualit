import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService, paqService } from "../services/api";
import { showErrorAlert } from "../utils/entretienAlerts";
import { useI18n } from "../context/I18nContext";
import "../styles/dashboard.css";

import { useSelection } from "../context/SelectionContext";

export default function Dashboard() {
  const navigate = useNavigate();

  // Récupérer la sélection du contexte
  const { selectedSite, selectedPlant } = useSelection();

  const [stats, setStats] = useState({
    totalCollaborateurs: 0,
    sansFaute: [],
    paqParNiveau: {},
    paqEnCours: [],
    segmentStats: [],
    performanceHistory: [],
  });

  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    loadDashboard();
  }, [selectedSite, selectedPlant]); // Recharger quand la sélection change

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // ✅ Construire les paramètres de filtrage par site/plant
      //    Le backend filtre aussi par le périmètre du user connecté (JWT).
      //    Ces params affinent encore davantage si l'utilisateur a sélectionné
      //    un site ou un plant spécifique dans l'interface.
      const params = {};
      if (selectedSite?.id) params.siteId = selectedSite.id;
      if (selectedPlant?.id) params.plantId = selectedPlant.id;

      console.log("Chargement dashboard avec filtres:", params);

      // ✅ Tous les appels transmettent maintenant les params siteId/plantId
      const [statsRes, paqRes, segmentStatsRes, performanceRes] = await Promise.all([
        dashboardService.getStats(params),
        paqService.getAll(params),
        dashboardService.getSegmentStats(params),
        dashboardService.getPerformanceHistory(params),
      ]);

      const paqs = paqRes.data || [];
      const paqActifs = paqs.filter(
        (p) => p.statut !== "CLOTURE" && p.statut !== "ARCHIVE"
      );

      const paqParNiveau = {};
      paqs.forEach((p) => {
        const niveau = p.niveau || 1;
        paqParNiveau[niveau] = (paqParNiveau[niveau] || 0) + 1;
      });

      const sansFaute = statsRes.data?.sansFaute || [];

      setStats({
        totalCollaborateurs: statsRes.data?.totalCollaborateurs || 0,
        paqEnCours: paqActifs,
        paqParNiveau,
        sansFaute,
        segmentStats: segmentStatsRes.data || [],
        performanceHistory: performanceRes.data || [],
      });
    } catch (error) {
      console.error("Erreur chargement dashboard", error);
      showErrorAlert("Erreur", "Impossible de charger les statistiques");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      const params = {};
      if (selectedSite?.id) params.siteId = selectedSite.id;
      if (selectedPlant?.id) params.plantId = selectedPlant.id;

      const response = await dashboardService.exportReport(format, params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `rapport-semestriel.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erreur export", error);
      showErrorAlert("Export impossible", "Erreur lors de l'export.");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t("loading_dashboard")}</p>
      </div>
    );

  const levelColors = {
    1: "#3b82f6",
    2: "#16a34a",
    3: "#f59e0b",
    4: "#ef4444",
    5: "#64748b",
  };

  const levelCounts = [1, 2, 3, 4, 5].map(
    (level) => stats.paqParNiveau[level] || 0
  );
  const totalPaq = levelCounts.reduce((sum, value) => sum + value, 0);

  let donutGradient = "conic-gradient(#e5e7eb 0deg, #e5e7eb 360deg)";
  if (totalPaq > 0) {
    let currentAngle = 0;
    const segments = levelCounts.map((value, index) => {
      const level = index + 1;
      const angle = (value / totalPaq) * 360;
      const start = currentAngle;
      const end = currentAngle + angle;
      currentAngle = end;
      return `${levelColors[level]} ${start}deg ${end}deg`;
    });
    donutGradient = `conic-gradient(${segments.join(", ")})`;
  }

  const sortedSegments = [...stats.segmentStats].sort(
    (a, b) => (b.totalCollaborateurs || 0) - (a.totalCollaborateurs || 0)
  );
  const topSegments = sortedSegments.slice(0, 6);
  const segmentTotal = topSegments.reduce(
    (sum, segment) => sum + (segment.totalCollaborateurs || 0),
    0
  );
  const segmentColors = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#f97316",
    "#64748b",
    "#94a3b8",
  ];
  let segmentGradient = "conic-gradient(#e5e7eb 0deg, #e5e7eb 360deg)";
  if (segmentTotal > 0) {
    let currentAngle = 0;
    const segs = topSegments.map((segment, index) => {
      const value = segment.totalCollaborateurs || 0;
      const angle = (value / segmentTotal) * 360;
      const start = currentAngle;
      const end = currentAngle + angle;
      currentAngle = end;
      return `${segmentColors[index % segmentColors.length]} ${start}deg ${end}deg`;
    });
    segmentGradient = `conic-gradient(${segs.join(", ")})`;
  }

  const performanceMap = new Map();
  stats.performanceHistory.forEach((entry) => {
    const key = entry.periode || "N/A";
    if (!performanceMap.has(key)) {
      performanceMap.set(key, {
        periode: key,
        amelioration: 0,
        stagnation: 0,
        regression: 0,
      });
    }
    const bucket = performanceMap.get(key);
    if (entry.evolution === "AMELIORATION") bucket.amelioration += 1;
    else if (entry.evolution === "STAGNATION") bucket.stagnation += 1;
    else bucket.regression += 1;
  });
  const performanceSeries = Array.from(performanceMap.values());
  const performanceMax = Math.max(
    1,
    ...performanceSeries.map((item) =>
      Math.max(item.amelioration, item.stagnation, item.regression)
    )
  );

  // ✅ Label du filtre actif affiché dans le titre du dashboard
  const getFilterLabel = () => {
    if (selectedPlant?.name) return ` — ${selectedPlant.name}`;
    if (selectedSite?.name) return ` — ${selectedSite.name}`;
    return "";
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>
            {t("dashboard_title")}
            {getFilterLabel()}
          </h2>
          {/* ✅ Bandeau d'info montrant le périmètre actif */}
          {(selectedSite || selectedPlant) && (
            <p className="filter-info text-muted">
              <i className="fas fa-filter me-1"></i>
              Statistiques filtrées par{" "}
              {selectedPlant ? "plant" : "site"} :{" "}
              <strong>{selectedPlant?.name || selectedSite?.name}</strong>
            </p>
          )}
        </div>
        <div className="dashboard-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/paq-dossier")}
          >
            {t("open_paq_file")}
          </button>
          <button
            className="btn btn-outline-success"
            onClick={() => handleExport("pdf")}
            disabled={exportLoading}
          >
            {exportLoading ? t("exporting") : t("export_pdf")}
          </button>
          <button
            className="btn btn-outline-success"
            onClick={() => handleExport("excel")}
            disabled={exportLoading}
          >
            {exportLoading ? t("exporting") : t("export_excel")}
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-label">{t("total_collaborators")}</div>
          <div className="stat-value text-primary">
            {stats.totalCollaborateurs}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("no_fault")}</div>
          <div className="stat-value text-success">
            {stats.sansFaute.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t("paq_in_progress")}</div>
          <div className="stat-value text-warning">
            {stats.paqEnCours.length}
          </div>
        </div>
       
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h5>Répartition des collaborateurs par niveau PAQ</h5>
              </div>
              <div className="panel-meta"> Total dossiers: {totalPaq}</div>
            </div>
            <div className="level-layout">
              <div className="level-bars">
                {[1, 2, 3, 4, 5].map((niveau, index) => {
                  const value = levelCounts[index];
                  const width =
                    totalPaq > 0
                      ? Math.round((value / totalPaq) * 100)
                      : 0;
                  return (
                    <div key={niveau} className="level-row">
                      <div className="level-title">
                        <span
                          className="level-dot"
                          style={{ background: levelColors[niveau] }}
                        />
                        Niveau {niveau}
                      </div>
                      <div className="level-bar">
                        <div
                          className="level-fill"
                          style={{
                            width: `${width}%`,
                            background: levelColors[niveau],
                          }}
                        />
                      </div>
                      <div className="level-value">{value}</div>
                    </div>
                  );
                })}
              </div>
              <div className="level-donut">
                <div
                  className="donut"
                  style={{ background: donutGradient }}
                >
                  <div className="donut-center">
                    <div className="donut-total">{totalPaq}</div>
                    <div className="donut-label">Dossiers PAQ</div>
                  </div>
                </div>
                <div className="donut-legend">
                  {[1, 2, 3, 4, 5].map((niveau) => (
                    <div key={niveau} className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: levelColors[niveau] }}
                      />
                      Niveau {niveau}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h5>Statistiques par segment</h5>
            </div>
            <div className="segment-donut-wrap">
              <div
                className="segment-donut"
                style={{ background: segmentGradient }}
              >
                <div className="segment-donut-center">
                  <div className="segment-donut-title">Segments</div>
                  <div className="segment-donut-total">{segmentTotal}</div>
                </div>
              </div>
              <div className="segment-list">
                {topSegments.map((segment, index) => {
                  const percent = segmentTotal
                    ? Math.round(
                        ((segment.totalCollaborateurs || 0) / segmentTotal) *
                          100
                      )
                    : 0;
                  return (
                    <div
                      key={`${segment.nom ?? "segment"}-${index}`}
                      className="segment-row"
                    >
                      <div className="segment-name">{segment.nom}</div>
                      <div className="segment-track">
                        <div
                          className="segment-fill"
                          style={{
                            width: `${percent}%`,
                            background:
                              segmentColors[index % segmentColors.length],
                          }}
                        />
                      </div>
                      <div className="segment-percent">{percent}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h5>Historique de performance des collaborateurs</h5>
            </div>
            <div className="performance-chart">
              <div className="performance-legend">
                <span className="legend-dot perf-good" /> Amélioration
                <span className="legend-dot perf-mid" /> Stagnation
                <span className="legend-dot perf-low" /> Régression
              </div>
              <div className="performance-bars">
                {performanceSeries.map((item, idx) => (
                  <div
                    key={`${item.periode}-${idx}`}
                    className="performance-group"
                  >
                    <div className="performance-stack">
                      <span
                        className="performance-bar perf-good"
                        style={{
                          height: `${
                            (item.amelioration / performanceMax) * 100
                          }%`,
                        }}
                      />
                      <span
                        className="performance-bar perf-mid"
                        style={{
                          height: `${
                            (item.stagnation / performanceMax) * 100
                          }%`,
                        }}
                      />
                      <span
                        className="performance-bar perf-low"
                        style={{
                          height: `${
                            (item.regression / performanceMax) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="performance-label">{item.periode}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Dossiers PAQ en cours */}
          <section className="panel compact">
            <div className="panel-header">
              <h5>Dossiers PAQ en cours</h5>
              <span className="panel-meta">{stats.paqEnCours.length}</span>
            </div>
            <div className="table-responsive">
              <table className="table dashboard-table compact-table">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Niveau</th>
                    <th>Date création</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.paqEnCours.length > 0 ? (
                    stats.paqEnCours.map((p, idx) => (
                      <tr key={p.id ?? p.collaboratorMatricule ?? idx}>
                        <td data-label="Matricule">
                          {p.collaboratorMatricule}
                        </td>
                        <td data-label="Niveau">
                          <span className="badge-level">
                            Niveau {p.niveau}
                          </span>
                        </td>
                        <td data-label="Date création">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString("fr-FR")
                            : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="empty-table">
                        Aucun dossier PAQ en cours
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Collaborateurs sans faute */}
          <section className="panel compact">
            <div className="panel-header">
              <h5>Collaborateurs sans faute</h5>
              <span className="panel-meta">{stats.sansFaute.length}</span>
            </div>
            <div className="table-responsive">
              <table className="table dashboard-table compact-table">
                <thead>
                  <tr>
                    <th>Matricule</th>
                    <th>Nom complet</th>
                    <th>Segment</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sansFaute.length > 0 ? (
                    stats.sansFaute.map((c, idx) => (
                      <tr key={c.id ?? c.matricule ?? idx}>
                        <td data-label="Matricule">{c.matricule}</td>
                        <td data-label="Nom complet">
                          {c.nom} {c.prenom || ""}
                        </td>
                        <td data-label="Segment">
                          <span className="badge-segment">{c.segment}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="empty-table">
                        Aucun collaborateur sans faute
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="dashboard-side"></aside>
      </div>
    </div>
  );
}
