import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../services/api";          
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import "../../styles/login.css";
import ForgotPasswordModal from "../../components/ForgotPasswordModal";


export default function Login() {
  const { t } = useI18n();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();
  const { siteName, plantName } = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/api/auth/login", {
        login,
        password,
        siteName,
        plantName,
      });

      const { userId, fullName, role, siteName: resSiteName, plantName: resPlantName, access_token, refresh_token } = res.data;

      authLogin(
        { userId, fullName, role, siteName: resSiteName, plantName: resPlantName },
        access_token,
        refresh_token
      );

      switch (role) {
        case "ADMIN": navigate("/admin"); break;
        default: navigate("/dashboard");
      }
    } catch (err) {
      const errorCode = err.response?.data?.error;
      const msg = err.response?.data?.message;
      
      if (errorCode === "WRONG_SITE") {
        setError(t("wrong_site_message", { siteName }));
      } else if (errorCode === "WRONG_PLANT") {
        setError(t("wrong_plant_message", { plantName }));
      } else {
        setError(msg || t("invalid_credentials"));
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="lc-wrapper">
      <div className="lc-bg" />
      <div className="lc-overlay" />

      <div className="lc-card">
        <div className="lc-logo-block">
          <h1 className="lc-title">{t("login_title")}</h1>
        </div>

        {siteName && plantName && (
          <div className="lc-context">
            <span className="lc-context-dot"></span>
            <span>{siteName}</span>
            <span className="lc-context-sep">—</span>
            <span>{plantName}</span>
          </div>
        )}

        {error && (
          <div className="lc-error">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#cc0000" strokeWidth="1.5"/>
              <path d="M10 6v5M10 13.5v.5" stroke="#cc0000" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="lc-form">
          <div className="lc-field">
            <label htmlFor="lc-login">{t("username")}</label>
            <div className="lc-input-wrap">
              <svg className="lc-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"
                      stroke="#9aabbb" strokeWidth="1.5"/>
                <path d="m22 6-10 7L2 6" stroke="#9aabbb" strokeWidth="1.5"/>
              </svg>
              <input
                id="lc-login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder={t("username_placeholder")}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="lc-field">
            <label htmlFor="lc-password">{t("password")}</label>
            <div className="lc-input-wrap">
              <svg className="lc-field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#9aabbb" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9aabbb" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                id="lc-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password_placeholder")}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="lc-eye"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t("hide_password") : t("show_password")}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                          stroke="#9aabbb" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                          stroke="#9aabbb" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke="#9aabbb" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                          stroke="#9aabbb" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="3" stroke="#9aabbb" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="lc-submit" disabled={loading}>
            {loading ? (
              <span className="lc-loading">
                <span className="lc-dot"></span>
                <span className="lc-dot"></span>
                <span className="lc-dot"></span>
              </span>
            ) : (
              t("login")
            )}
          </button>
        </form>

        <div className="lc-footer">
          <button 
            type="button" 
            className="lc-forgot-link"
            onClick={() => setShowForgotPassword(true)}
          >
            {t("forgot_password")}
          </button>
        </div>

        <ForgotPasswordModal 
  isOpen={showForgotPassword}
  onClose={() => setShowForgotPassword(false)}
/>
      </div>
    </div>
  );
}