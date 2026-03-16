import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService, paqService } from "../services/api";

export default function Dashboard() {

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalCollaborateurs: 0,
    sansFaute: [],
    paqParNiveau: {},
    paqEnCours: [],
    segmentStats: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {

      const [statsRes, paqRes] = await Promise.all([
        dashboardService.getStats(),
        paqService.getAll()
      ]);

      const paqs = paqRes.data;

      const paqActifs = paqs.filter(
        p => p.statut !== "CLOTURE" && p.statut !== "ARCHIVE"
      );

      setStats({
        ...statsRes.data,
        paqEnCours: paqActifs
      });

    } catch (error) {
      console.error("Erreur chargement dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="dashboard">

      <h2>Tableau de Bord PAQ</h2>

      <div className="mb-3">
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/paq-dossier")}
        >
          Ouvrir un dossier PAQ
        </button>
      </div>

      <div className="kpi-grid">

        <div className="kpi">
          <h3>{stats.totalCollaborateurs}</h3>
          <p>Collaborateurs</p>
        </div>

        <div className="kpi">
          <h3>{stats.sansFaute.length}</h3>
          <p>Sans faute</p>
        </div>

        <div className="kpi">
          <h3>{stats.paqEnCours.length}</h3>
          <p>PAQ en cours</p>
        </div>

      </div>

      <h3>Répartition PAQ par niveau</h3>

      <ul>
        {Object.entries(stats.paqParNiveau).map(([niveau, value]) => (
          <li key={niveau}>
            Niveau {niveau} : {value}
          </li>
        ))}
      </ul>

      <h3>Collaborateurs sans faute</h3>

      <table>
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Nom</th>
            <th>Segment</th>
          </tr>
        </thead>

        <tbody>
          {stats.sansFaute.map(c => (
            <tr key={c.id}>
              <td>{c.matricule}</td>
              <td>{c.nom}</td>
              <td>{c.segment}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>PAQ en cours</h3>

      <table>
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Niveau</th>
            <th>Statut</th>
          </tr>
        </thead>

        <tbody>
          {stats.paqEnCours.map(p => (
            <tr key={p.id}>
              <td>{p.collaborateurMatricule}</td>
              <td>{p.niveau}</td>
              <td>{p.statut}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
