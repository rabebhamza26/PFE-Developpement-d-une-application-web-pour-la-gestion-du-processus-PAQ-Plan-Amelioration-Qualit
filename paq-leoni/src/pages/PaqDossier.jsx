import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/paq-dossier.css";

export default function PaqDossier() {
  const { matricule } = useParams();
  const navigate = useNavigate();

  const [collaborator, setCollaborator] = useState(null);
  const [paq, setPaq] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const collabRes = await axios.get(
        `http://localhost:8081/api/collaborators/${matricule}`
      );
      const paqRes = await axios.get(
        `http://localhost:8081/api/paq/${matricule}`
      );

      setCollaborator(collabRes.data);
      setPaq(paqRes.data);

      if (paqRes.data?.historique) {
        setHistorique(JSON.parse(paqRes.data.historique));
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le dossier PAQ");
    } finally {
      setLoading(false);
    }
  };

  // Créer PAQ via bouton
  const createPaq = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `http://localhost:8081/api/paq?matricule=${matricule}`
      );
      if (res.data) {
        setPaq(res.data);
        if (res.data.historique) {
          setHistorique(JSON.parse(res.data.historique));
        }
      } else {
        alert("Le PAQ ne peut pas être créé (moins de 6 mois ou collaborateur inexistant).");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du PAQ");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="paq-loading">Chargement...</div>;
  if (error)
    return (
      <div className="paq-shell">
        <button onClick={() => navigate("/collaborateurs")}>Retour</button>
        <p>{error}</p>
      </div>
    );

  return (
    <div className="paq-shell">
      <div className="paq-header">
        <h1>Dossier PAQ</h1>
        <div className="paq-actions">
          <button onClick={() => navigate("/collaborateurs")} className="btn-secondary">
            Retour
          </button>
          <button onClick={() => navigate(`/create-entretien/${matricule}`)} className="btn-primary">
            Créer Entretien
          </button>
          {!paq && (
            <button onClick={createPaq} className="btn-success">
              Créer PAQ
            </button>
          )}
        </div>
      </div>

      {collaborator && (
        <div className="paq-meta">
          <p><b>Matricule :</b> {collaborator.matricule}</p>
          <p><b>Nom :</b> {collaborator.name}</p>
          <p><b>Segment :</b> {collaborator.segment}</p>
          <p><b>Date embauche :</b> {collaborator.hireDate}</p>
          <p><b>Niveau :</b> {paq?.niveau || "-"}</p>
        </div>
      )}

      <section className="paq-block">
        <h3>Historique</h3>
        {historique.length === 0 ? (
          <p>Aucun historique disponible</p>
        ) : (
          <table className="paq-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Détail</th>
              </tr>
            </thead>
            <tbody>
              {historique.map((h, i) => (
                <tr key={i}>
                  <td>{h.date}</td>
                  <td>{h.action}</td>
                  <td>{h.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}