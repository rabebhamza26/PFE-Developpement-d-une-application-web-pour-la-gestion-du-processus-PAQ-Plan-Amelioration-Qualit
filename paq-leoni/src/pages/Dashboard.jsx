import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService, paqService } from "../services/api";
import "../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalCollaborateurs: 0,
    sansFaute: [],
    paqParNiveau: {},
    paqEnCours: [],
    segmentStats: [],
    performanceHistory: []
  });

  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, paqRes, segmentStatsRes, performanceRes] = await Promise.all([
        dashboardService.getStats(),
        paqService.getAll(),
        dashboardService.getSegmentStats(),
        dashboardService.getPerformanceHistory()
      ]);

      const paqs = paqRes.data;
      const paqActifs = paqs.filter((p) => p.statut !== "CLOTURE" && p.statut !== "ARCHIVE");

      const paqParNiveau = {};
      paqs.forEach((p) => {
        const niveau = p.niveau || 1;
        paqParNiveau[niveau] = (paqParNiveau[niveau] || 0) + 1;
      });

      const sansFaute = statsRes.data.sansFaute || [];

      setStats({
        ...statsRes.data,
        paqEnCours: paqActifs,
        paqParNiveau,
        sansFaute,
        segmentStats: segmentStatsRes.data,
        performanceHistory: performanceRes.data
      });
    } catch (error) {
      console.error("Erreur chargement dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      const response = await dashboardService.exportReport(format);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `rapport-semestriel.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Erreur export", error);
      alert("Erreur lors de l'export");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-5">Chargement du tableau de bord...</div>;

  const levelColors = {
    1: "#3b82f6",
    2: "#16a34a",
    3: "#f59e0b",
    4: "#ef4444",
    5: "#64748b"
  };

  const levelCounts = [1, 2, 3, 4, 5].map((level) => stats.paqParNiveau[level] || 0);
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
  const segmentMax = Math.max(1, ...topSegments.map((segment) => segment.totalCollaborateurs || 0));
  const segmentTotal = topSegments.reduce((sum, segment) => sum + (segment.totalCollaborateurs || 0), 0);
  const segmentColors = ["#3b82f6", "#22c55e", "#f59e0b", "#f97316", "#64748b", "#94a3b8"];
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
        regression: 0
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
    ...performanceSeries.map((item) => Math.max(item.amelioration, item.stagnation, item.regression))
  );


  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Tableau de Bord PAQ</h2>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-primary" onClick={() => navigate("/paq-dossier")}>
            Ouvrir un dossier PAQ
          </button>
          <button
            className="btn btn-outline-success"
            onClick={() => handleExport("pdf")}
            disabled={exportLoading}
          >
            {exportLoading ? "Export..." : "Exporter PDF"}
          </button>
          <button
            className="btn btn-outline-success"
            onClick={() => handleExport("excel")}
            disabled={exportLoading}
          >
            {exportLoading ? "Export..." : "Exporter Excel"}
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-label">Total collaborateurs</div>
          <div className="stat-value text-primary">{stats.totalCollaborateurs}</div>
          <div className="stat-hint">Population suivie</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sans faute</div>
          <div className="stat-value text-success">{stats.sansFaute.length}</div>
          <div className="stat-hint">Aucun dossier en cours</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">PAQ en cours</div>
          <div className="stat-value text-warning">{stats.paqEnCours.length}</div>
          <div className="stat-hint">Dossiers actifs</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Niveaux actifs</div>
          <div className="stat-value text-info">{Object.keys(stats.paqParNiveau).length}</div>
          <div className="stat-hint">Niveaux avec au moins 1 dossier</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h5>Repartition des collaborateurs par niveau PAQ</h5>
                <p className="panel-subtitle">Vue combinee par niveau et proportion totale.</p>
              </div>
              <div className="panel-meta">Total dossiers: {totalPaq}</div>
            </div>
            <div className="level-layout">
              <div className="level-bars">
                {[1, 2, 3, 4, 5].map((niveau, index) => {
                  const value = levelCounts[index];
                  const width = totalPaq > 0 ? Math.round((value / totalPaq) * 100) : 0;
                  return (
                    <div key={niveau} className="level-row">
                      <div className="level-title">
                        <span className="level-dot" style={{ background: levelColors[niveau] }} />
                        Niveau {niveau}
                      </div>
                      <div className="level-bar">
                        <div
                          className="level-fill"
                          style={{ width: `${width}%`, background: levelColors[niveau] }}
                        />
                      </div>
                      <div className="level-value">{value}</div>
                    </div>
                  );
                })}
              </div>
              <div className="level-donut">
                <div className="donut" style={{ background: donutGradient }}>
                  <div className="donut-center">
                    <div className="donut-total">{totalPaq}</div>
                    <div className="donut-label">Dossiers PAQ</div>
                  </div>
                </div>
                <div className="donut-legend">
                  {[1, 2, 3, 4, 5].map((niveau) => (
                    <div key={niveau} className="legend-item">
                      <span className="legend-dot" style={{ background: levelColors[niveau] }} />
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
              <div className="segment-donut" style={{ background: segmentGradient }}>
                <div className="segment-donut-center">
                  <div className="segment-donut-title">Segments</div>
                  <div className="segment-donut-total">{segmentTotal}</div>
                </div>
              </div>
              <div className="segment-list">
                {topSegments.map((segment, index) => {
                  const percent = segmentTotal
                    ? Math.round(((segment.totalCollaborateurs || 0) / segmentTotal) * 100)
                    : 0;
                  return (
                    <div key={`${segment.nom ?? "segment"}-${index}`} className="segment-row">
                      <div className="segment-name">{segment.nom}</div>
                      <div className="segment-track">
                        <div
                          className="segment-fill"
                          style={{
                            width: `${percent}%`,
                            background: segmentColors[index % segmentColors.length]
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
                <span className="legend-dot perf-good" /> Amelioration
                <span className="legend-dot perf-mid" /> Stagnation
                <span className="legend-dot perf-low" /> Regression
              </div>
              <div className="performance-bars">
                {performanceSeries.map((item, idx) => (
                  <div key={`${item.periode}-${idx}`} className="performance-group">
                    <div className="performance-stack">
                      <span
                        className="performance-bar perf-good"
                        style={{ height: `${(item.amelioration / performanceMax) * 100}%` }}
                      />
                      <span
                        className="performance-bar perf-mid"
                        style={{ height: `${(item.stagnation / performanceMax) * 100}%` }}
                      />
                      <span
                        className="performance-bar perf-low"
                        style={{ height: `${(item.regression / performanceMax) * 100}%` }}
                      />
                    </div>
                    <div className="performance-label">{item.periode}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="dashboard-side">
          <section className="panel compact">
            <div className="panel-header">
              <h5>Dossiers PAQ en cours</h5>
              <span className="panel-meta">{stats.paqEnCours.length}</span>
            </div>
            <div className="table-responsive">
              <table className="table dashboard-table compact-table">
                <thead>
                  <tr>
                    <th>Matrice</th>
                    <th>Niveau</th>
                    <th>Creation</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.paqEnCours.map((p, idx) => (
                    <tr key={p.id ?? p.collaboratorMatricule ?? idx}>
                      <td>{p.collaboratorMatricule}</td>
                      <td>{p.niveau}</td>
                      <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

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
                    <th>Nom</th>
                    <th>Segment</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sansFaute.map((c, idx) => (
                    <tr key={c.id ?? c.matricule ?? idx}>
                      <td>{c.matricule}</td>
                      <td>{c.nom}</td>
                      <td>{c.segment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
