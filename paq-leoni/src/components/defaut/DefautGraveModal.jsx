// src/components/defaut/DefautGraveModal.jsx
import { useState } from "react";
import { defautGraveService, userService } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";
import { useEmails } from "../../hooks/useEmails";

/**
 * Modal "Déclarer un défaut grave"
 * Accessible uniquement à SL et SGL (permission: defaut:grave:notify)
 *
 * COMMENT DÉCLARER UN DÉFAUT GRAVE :
 * - Un défaut grave est une faute qui nécessite une intervention immédiate du SGL.
 * - L'utilisateur SL ou SGL ouvre ce modal depuis le dossier PAQ du collaborateur.
 * - Il décrit le défaut, choisit optionnellement un SGL spécifique, et soumet.
 * - Le système notifie IMMÉDIATEMENT tous les SGL actifs (in-app + email).
 * - Le processus PAQ démarre au niveau 1 avec participation obligatoire du SGL.
 *
 * COMMENT RECONNAÎTRE UN DÉFAUT GRAVE :
 * - Faute grave répétée ou faute mettant en danger la sécurité/qualité.
 * - Le SL ou SGL juge que la situation nécessite l'intervention hiérarchique immédiate.
 */
export default function DefautGraveModal({ matricule, nomCollab, onClose, onSuccess }) {
  const { canNotifyDefautGrave } = usePermissions();
  const { emailsList: sglEmails, loadingEmails } = useEmails("all");

  const [description, setDescription] = useState("");
  const [sglEmail, setSglEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  if (!canNotifyDefautGrave) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <span style={{ fontSize: "2.5rem" }}>🔒</span>
          <p style={{ color: "#f44336", marginTop: "1rem" }}>
            Seuls les rôles SL et SGL peuvent déclarer un défaut grave.
          </p>
          <button onClick={onClose} style={btnStyles.cancel}>Fermer</button>
        </div>
      </Overlay>
    );
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrorMsg("Veuillez décrire le défaut grave.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      await defautGraveService.notifier({
        matricule,
        descriptionDefaut: description.trim(),
        sglEmail: sglEmail.trim() || null,
      });
      setStatus("success");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      const msg = err.response?.data?.message || err.response?.data || "Erreur lors de la notification.";
      setErrorMsg(typeof msg === "string" ? msg : "Erreur serveur.");
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={styles.alertBanner}>
        ⚠️ DÉFAUT GRAVE — ACTION IMMÉDIATE REQUISE
      </div>

      <div style={{ padding: "1.5rem 1.5rem 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🚨</span>
          <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#fff" }}>
            Déclarer un Défaut Grave
          </h2>
          <button onClick={onClose} style={btnStyles.close}>✕</button>
        </div>
        <p style={{ color: "#8899aa", fontSize: "0.88rem", margin: 0 }}>
          Collaborateur : <strong style={{ color: "#00b4d8" }}>{nomCollab || matricule}</strong>
          {" · Matricule : "}
          <code style={{ color: "#ffd700" }}>{matricule}</code>
        </p>
      </div>

      {status === "success" ? (
        <div style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <p style={{ color: "#4caf82", lineHeight: 1.6 }}>
            Tous les SGL ont été notifiés (système + email). Le processus PAQ est activé immédiatement.
          </p>
          <button onClick={onClose} style={{ ...btnStyles.primary, marginTop: "1rem" }}>Fermer</button>
        </div>
      ) : (
        <div style={{ padding: "1.5rem" }}>
          <label style={styles.label}>DESCRIPTION DU DÉFAUT <span style={{ color: "#f44336" }}>*</span></label>
          <textarea value={description}
            onChange={e => { setDescription(e.target.value); setErrorMsg(""); }}
            placeholder="Décrivez précisément la nature du défaut grave observé..."
            rows={4} style={styles.textarea}/>

          <label style={styles.label}>
            SGL À NOTIFIER <span style={{ color: "#8899aa" }}>(optionnel — si vide, tous les SGL actifs)</span>
          </label>
          <select value={sglEmail} onChange={e => setSglEmail(e.target.value)}
            style={{ ...styles.textarea, padding: "0.6rem", height: "auto" }}
            disabled={loadingEmails}>
            <option value="">-- Tous les SGL actifs --</option>
            {sglEmails.map((email, i) => (
              <option key={i} value={email}>{email}</option>
            ))}
          </select>
          {loadingEmails && <small style={{ color: "#8899aa" }}>Chargement des emails...</small>}

          <div style={styles.infoBox}>
            <strong>📋 Ce que cette action déclenche :</strong>
            <ul style={{ margin: "0.5rem 0 0 1rem", padding: 0 }}>
              <li>Notification in-app immédiate à tous les SGL actifs</li>
              <li>Email urgent envoyé aux SGL concernés</li>
              <li>Activation du processus PAQ — participation SGL obligatoire dès le niveau 1</li>
            </ul>
          </div>

          <div style={styles.infoBox}>
            <strong>ℹ️ Qu'est-ce qu'un défaut grave ?</strong>
            <ul style={{ margin: "0.5rem 0 0 1rem", padding: 0 }}>
              <li>Faute mettant en danger la sécurité ou la qualité de production</li>
              <li>Faute grave répétée nécessitant une intervention hiérarchique immédiate</li>
              <li>Comportement sérieux nécessitant le suivi direct du SGL</li>
            </ul>
          </div>

          {errorMsg && (
            <p style={{ color: "#f44336", fontSize: "0.85rem", marginBottom: "1rem" }}>⚠ {errorMsg}</p>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={onClose} disabled={status === "loading"} style={btnStyles.cancel}>
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={status === "loading"}
              style={{ ...btnStyles.danger, opacity: status === "loading" ? 0.7 : 1 }}>
              {status === "loading" ? "⏳ Notification en cours..." : "🚨 Notifier les SGL"}
            </button>
          </div>
        </div>
      )}
    </Overlay>
  );
}

function Overlay({ onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "1rem",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#1e2433", border: "1px solid #3d1515",
        borderRadius: "12px", width: "100%", maxWidth: "520px",
        color: "#e0e6f0", overflow: "hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  alertBanner: {
    background: "#b71c1c", color: "#fff", textAlign: "center",
    padding: "0.5rem", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.08em",
  },
  label: {
    display: "block", marginBottom: "0.4rem", marginTop: "1rem",
    fontSize: "0.75rem", color: "#8899aa",
    textTransform: "uppercase", letterSpacing: "0.05em",
  },
  textarea: {
    width: "100%", background: "#151b28", border: "1px solid #2e3a50",
    borderRadius: "8px", color: "#e0e6f0", padding: "0.75rem",
    fontSize: "0.9rem", resize: "vertical", outline: "none", boxSizing: "border-box",
  },
  infoBox: {
    background: "#0d1520", border: "1px solid #1e3050", borderRadius: "8px",
    padding: "0.85rem 1rem", fontSize: "0.82rem", color: "#8899aa",
    marginTop: "1rem", lineHeight: 1.6,
  },
};

const btnStyles = {
  close: { marginLeft: "auto", background: "transparent", border: "none", color: "#8899aa", fontSize: "1.2rem", cursor: "pointer" },
  cancel: { flex: 1, background: "transparent", border: "1px solid #2e3a50", borderRadius: "8px", padding: "0.75rem", color: "#8899aa", cursor: "pointer", fontWeight: 500 },
  primary: { background: "#00b4d8", border: "none", borderRadius: "8px", padding: "0.75rem 2rem", color: "#fff", fontWeight: 600, cursor: "pointer", width: "100%" },
  danger: { flex: 2, background: "#b71c1c", border: "none", borderRadius: "8px", padding: "0.75rem", color: "#fff", fontWeight: 700, cursor: "pointer" },
};