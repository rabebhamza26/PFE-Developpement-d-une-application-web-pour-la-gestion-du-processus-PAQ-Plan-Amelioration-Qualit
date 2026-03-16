import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../services/api";

export default function AddUser() {
  const initialForm = {
    nomUtilisateur: "",
    login: "",
    password: "",
    role: "ADMIN"
  };
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setForm(initialForm);
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await userService.createUser(form);
      navigate("/admin/users", { replace: true });
    } catch (err) {
      setError("Erreur lors de l'ajout de l'utilisateur: " + (err.response?.data?.message || err.message));
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="card-title mb-0">
                <i className="fas fa-user-plus me-2"></i>
                Ajouter un utilisateur
              </h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="mb-3">
                  <label htmlFor="nomUtilisateur" className="form-label">
                    <i className="fas fa-user me-2"></i>Nom complet *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="nomUtilisateur"
                    name="nomUtilisateur"
                    placeholder="Entrez le nom complet"
                    value={form.nomUtilisateur}
                    onChange={handleChange}
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="login" className="form-label">
                    <i className="fas fa-sign-in-alt me-2"></i>Login *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="login"
                    name="login"
                    placeholder="Entrez le login"
                    value={form.login}
                    onChange={handleChange}
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    <i className="fas fa-lock me-2"></i>Mot de passe *
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    placeholder="Entrez le mot de passe"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="role" className="form-label">
                    <i className="fas fa-user-tag me-2"></i>Rôle *
                  </label>
                  <select
                    className="form-select"
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="RH">RH</option>
                    <option value="SGL">SGL</option>
                    <option value="QM">QM</option>
                  </select>
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/admin")}
                    disabled={loading}
                  >
                    <i className="fas fa-times me-2"></i>
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Ajouter l'utilisateur
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
