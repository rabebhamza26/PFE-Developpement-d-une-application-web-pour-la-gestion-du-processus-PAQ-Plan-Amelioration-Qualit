import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { userService } from "../services/api";

export default function EditUser() {
  const { id } = useParams();
  const [form, setForm] = useState({
    nomUtilisateur: "",
    login: "",
    password: "",
    role: "ADMIN"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await userService.getUserById(id);
      setForm({
        nomUtilisateur: res.data.nomUtilisateur,
        login: res.data.login,
        password: "", // Ne pas pré-remplir le mot de passe
        role: res.data.role
      });
    } catch (err) {
      setError("Erreur lors du chargement de l'utilisateur: " + (err.response?.data?.message || err.message));
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Si le mot de passe est vide, on ne l'envoie pas
      const dataToSend = { ...form };
      if (!form.password.trim()) {
        delete dataToSend.password;
      }

      await userService.updateUser(id, dataToSend);
      navigate("/admin/users");
    } catch (err) {
      setError("Erreur lors de la modification: " + (err.response?.data?.message || err.message));
      console.error("Erreur:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2">Chargement de l'utilisateur...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card">
            <div className="card-header bg-warning text-dark">
              <h4 className="card-title mb-0">
                <i className="fas fa-user-edit me-2"></i>
                Modifier l'utilisateur
              </h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
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
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    <i className="fas fa-lock me-2"></i>Mot de passe
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    placeholder="Laissez vide pour conserver le mot de passe actuel"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <div className="form-text">
                    Laissez vide pour conserver le mot de passe actuel
                  </div>
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
                    disabled={saving}
                  >
                    <i className="fas fa-times me-2"></i>
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Modification en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Modifier l'utilisateur
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