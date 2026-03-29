import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/login.css";

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  // Récupération du site et plant sélectionnés depuis la page précédente
  const { siteName, plantName } = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", {
        login,
        password,
        siteName,
        plantName,
      });

      const { role, userId, fullName } = res.data;

      // Stocker l'utilisateur connecté dans le contexte global
      setUser({ userId, fullName, role, siteName, plantName });

      // Redirection selon le rôle
      switch (role) {
        case "ADMIN":
          navigate("/admin");
          break;
        case "SL":
          navigate("/collaborateurs");
          break;
        case "QM_SEGMENT":
          navigate("/qm-segment-dashboard");
          break;
        case "QM_PLANT":
          navigate("/qm-plant-dashboard");
          break;
        case "SGL":
          navigate("/sgl-dashboard");
          break;
        case "HP":
          navigate("/hp-dashboard");
          break;
        case "RH":
          navigate("/rh-dashboard");
          break;
        case "COORDINATEUR_FORMATION":
          navigate("/formation-dashboard");
          break;
        default:
          setError("Rôle non reconnu");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants incorrects");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <h1 className="leoni-title">LEONI</h1>
          <h2 className="paq-title">PAQ</h2>
        </div>

        {/* Affichage du contexte site / plant sélectionnés */}
        {siteName && plantName && (
          <div className="login-context">
            <span>📍 {siteName}</span>
            <span className="separator">›</span>
            <span>🏭 {plantName}</span>
          </div>
        )}

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login">Login</label>
            <input
              id="login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              disabled={loading}
              placeholder="Votre identifiant"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Connexion..." : "Se Connecter"}
          </button>

          <div className="forgot-password">Mot de passe oublié ?</div>
        </form>

        <button
          type="button"
          className="back-link"
          onClick={() => navigate(-1)}
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}
