// src/components/ForgotPasswordModal.jsx
import React, { useState } from "react";
import API from "../services/api";
import { showErrorAlert, showSuccessAlert } from "../utils/entretienAlerts";

import "../styles/forgot-password-modal.css";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [login, setLogin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await API.post("/api/auth/forgot-password", {
        email: email || null,
        login: login || null
      });

      if (response.data.success) {
        setMessage(response.data.message);
        await showSuccessAlert("Demande envoyee", response.data.message || "Votre demande a bien ete envoyee.");
        setEmail("");
        setLogin("");
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1200);
      } else {
        const message = response.data.message || "Une erreur est survenue";
        setError(message);
        await showErrorAlert("Envoi impossible", message);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Une erreur est survenue";
      setError(message);
      await showErrorAlert("Envoi impossible", message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fpm-overlay" onClick={onClose}>
      <div className="fpm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fpm-header">
          <h3>Mot de passe oublié</h3>
          <button className="fpm-close" onClick={onClose}>×</button>
        </div>

        <div className="fpm-body">
          <p>
            Entrez votre email ou votre login. L'administrateur recevra votre demande 
            et vous enverra un nouveau mot de passe par email.
          </p>

          {message && (
            <div className="fpm-message success">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"/>
              </svg>
              {message}
            </div>
          )}

          {error && (
            <div className="fpm-message error">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="fpm-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                disabled={loading}
              />
            </div>

            <div className="fpm-divider">
              <span>ou</span>
            </div>

            <div className="fpm-field">
              <label htmlFor="login">Login</label>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Votre login"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="fpm-submit" 
              disabled={loading || (!email && !login)}
            >
              {loading ? (
                <span className="fpm-loading">
                  <span className="fpm-dot"></span>
                  <span className="fpm-dot"></span>
                  <span className="fpm-dot"></span>
                </span>
              ) : (
                "Envoyer la demande"
              )}
            </button>
          </form>
        </div>

        <div className="fpm-footer">
          <button type="button" onClick={onClose} className="fpm-cancel">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}