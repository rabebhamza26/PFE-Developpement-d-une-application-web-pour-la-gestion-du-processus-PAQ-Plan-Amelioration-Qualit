import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }), // ✅ CORRECTION ICI
      });

      if (!res.ok) {
        const message = await res.text();
        setError(message);
        setLoading(false);
        return;
      }

      const role = await res.text();

      // ✅ Redirection selon TON enum Role

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
      setError("Erreur de connexion au serveur");
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
          <h2 className="paq-title">PAQ </h2>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">

          <div className="form-group">
            <label>login</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se Connecter"}
          </button>

          <div className="forgot-password">
            Mot de passe oublié ?
          </div>

        </form>
      </div>
    </div>
  );
}
