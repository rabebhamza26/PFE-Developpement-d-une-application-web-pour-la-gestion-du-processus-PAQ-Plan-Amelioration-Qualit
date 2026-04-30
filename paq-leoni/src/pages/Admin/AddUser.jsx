// AddUser.jsx - Version avec selects multiples natifs
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService, siteService, plantService, getSegments } from "../../services/api";

export default function AddUser() {
  const initialForm = {
    nomUtilisateur: "",
    login: "",
    email: "", 
    password: "",
    role: "ADMIN",
    active: true,
    siteIds: [],
    plantIds: [],
    segmentIds: []
  };
  
  const [form, setForm] = useState(initialForm);
  const [sites, setSites] = useState([]);
  const [allPlants, setAllPlants] = useState([]);
  const [segments, setSegments] = useState([]);
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [sitesRes, plantsRes, segmentsRes] = await Promise.all([
        siteService.getAll(),
        plantService.getAll(),
        getSegments()
      ]);
      setSites(sitesRes.data || []);
      setAllPlants(plantsRes.data || []);
      setSegments(segmentsRes.data || []);
    } catch (err) {
      console.error("Erreur chargement données:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSiteChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const siteIds = selectedOptions.map(opt => parseInt(opt.value));
    
    setForm({
      ...form,
      siteIds: siteIds,
      plantIds: [] // Reset plants when sites change
    });
    
    // Filter plants based on selected sites
    if (siteIds.length > 0) {
      const filtered = allPlants.filter(plant => siteIds.includes(plant.siteId));
      setFilteredPlants(filtered);
    } else {
      setFilteredPlants([]);
    }
  };

  const handlePlantChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const plantIds = selectedOptions.map(opt => parseInt(opt.value));
    setForm({
      ...form,
      plantIds: plantIds
    });
  };

  const handleSegmentChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const segmentIds = selectedOptions.map(opt => parseInt(opt.value));
    setForm({
      ...form,
      segmentIds: segmentIds
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = { 
        nomUtilisateur: form.nomUtilisateur,
        login: form.login,
        email: form.email,
        password: form.password,
        role: form.role,
        active: true,
        siteIds: form.siteIds,
        plantIds: form.plantIds,
        segmentIds: form.segmentIds
      };
      await userService.createUser(payload);
      navigate("/admin/users", { replace: true });
    } catch (err) {
      setError("Erreur lors de l'ajout de l'utilisateur: " + (err.response?.data?.message || err.message));
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container-fluid mt-4">
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          <div className="card shadow-sm">
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
                <div className="row">
                  <div className="col-md-6 mb-3">
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

                  <div className="col-md-6 mb-3">
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
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="email" className="form-label">
                      <i className="fas fa-envelope me-2"></i>Email *
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      placeholder="Entrez l'email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
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
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="role" className="form-label">
                    <i className="fas fa-user-tag me-2"></i>Rôle *
                  </label>
                  <select 
                    name="role" 
                    value={form.role} 
                    onChange={handleChange} 
                    className="form-select"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="SL">SL</option>
                    <option value="QM_SEGMENT">QM Segment</option>
                    <option value="QM_PLANT">QM Plant</option>
                    <option value="SGL">SGL</option>
                    <option value="HP">HP</option>
                    <option value="RH">RH</option>
                    <option value="COORDINATEUR_FORMATION">Coordinateur Formation</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <i className="fas fa-building me-2"></i>Sites (sélection multiple)
                  </label>
                  <select 
                    multiple 
                    className="form-select" 
                    onChange={handleSiteChange}
                    style={{ minHeight: '120px' }}
                  >
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs sites</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <i className="fas fa-industry me-2"></i>Plants (sélection multiple)
                  </label>
                  <select 
                    multiple 
                    className="form-select" 
                    onChange={handlePlantChange}
                    disabled={form.siteIds.length === 0}
                    style={{ minHeight: '120px' }}
                  >
                    {filteredPlants.map(plant => (
                      <option key={plant.id} value={plant.id}>
                        {plant.name}
                      </option>
                    ))}
                  </select>
                  {form.siteIds.length === 0 && (
                    <small className="text-muted">Sélectionnez d'abord au moins un site</small>
                  )}
                  {form.siteIds.length > 0 && (
                    <small className="text-muted">Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs plants</small>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label">
                    <i className="fas fa-tag me-2"></i>Segments (sélection multiple)
                  </label>
                  <select 
                    multiple 
                    className="form-select" 
                    onChange={handleSegmentChange}
                    style={{ minHeight: '120px' }}
                  >
                    {segments.map(segment => (
                      <option key={segment.id} value={segment.id}>
                        {segment.nomSegment}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs segments</small>
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/admin/users")}
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