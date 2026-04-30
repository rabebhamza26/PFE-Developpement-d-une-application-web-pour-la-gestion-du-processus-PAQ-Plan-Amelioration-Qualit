// EditUser.jsx - Version corrigée (sans l'avertissement selected)
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { userService, siteService, plantService, getSegments } from "../../services/api";

export default function EditUser() {
  const { id } = useParams();
  const [form, setForm] = useState({
    nomUtilisateur: "",
    login: "",
    email: "",
    password: "",
    role: "ADMIN",
    active: true,
    siteIds: [],
    plantIds: [],
    segmentIds: []
  });
  const [sites, setSites] = useState([]);
  const [allPlants, setAllPlants] = useState([]);
  const [segments, setSegments] = useState([]);
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, sitesRes, plantsRes, segmentsRes] = await Promise.all([
        userService.getUserById(id),
        siteService.getAll(),
        plantService.getAll(),
        getSegments()
      ]);
      
      setSites(sitesRes.data || []);
      const plantsData = plantsRes.data || [];
      setAllPlants(plantsData);
      setSegments(segmentsRes.data || []);
      
      const user = userRes.data;
      setForm({
        nomUtilisateur: user.nomUtilisateur || "",
        login: user.login || "",
        email: user.email || "",
        password: "",
        role: user.role || "ADMIN",
        active: user.active ?? true,
        siteIds: user.siteIds || [],
        plantIds: user.plantIds || [],
        segmentIds: user.segmentIds || []
      });
      
      // Filter plants based on selected sites
      if (user.siteIds && user.siteIds.length > 0) {
        const filtered = plantsData.filter(plant => user.siteIds.includes(plant.siteId));
        setFilteredPlants(filtered);
      }
    } catch (err) {
      setError("Erreur lors du chargement: " + (err.response?.data?.message || err.message));
      console.error("Erreur chargement:", err);
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

  const handleSiteChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const siteIds = selectedOptions.map(opt => parseInt(opt.value));
    
    setForm({
      ...form,
      siteIds: siteIds,
      plantIds: [] // Reset plants when sites change
    });
    
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
    setSaving(true);

    try {
      const dataToSend = { 
        nomUtilisateur: form.nomUtilisateur,
        login: form.login,
        email: form.email,
        role: form.role,
        active: form.active,
        siteIds: form.siteIds,
        plantIds: form.plantIds,
        segmentIds: form.segmentIds
      };
      
      if (form.password && form.password.trim()) {
        dataToSend.password = form.password;
      }

      await userService.updateUser(id, dataToSend);
      navigate("/admin/users");
    } catch (err) {
      setError("Erreur lors de la modification: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="nomUtilisateur" className="form-label">Nom complet *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="nomUtilisateur"
                      name="nomUtilisateur"
                      value={form.nomUtilisateur}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="login" className="form-label">Login *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="login"
                      name="login"
                      value={form.login}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="email" className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="password" className="form-label">Nouveau mot de passe</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      placeholder="Laissez vide pour conserver l'ancien"
                      value={form.password}
                      onChange={handleChange}
                    />
                    <div className="form-text">
                      Remplissez ce champ uniquement si vous souhaitez changer le mot de passe
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="role" className="form-label">Rôle *</label>
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
                    value={form.siteIds.map(id => id.toString())}
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
                    value={form.plantIds.map(id => id.toString())}
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
                    value={form.segmentIds.map(id => id.toString())}
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
                  <button type="button" className="btn btn-secondary" onClick={() => navigate("/admin/users")} disabled={saving}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-warning" disabled={saving}>
                    {saving ? "Modification en cours..." : "Modifier l'utilisateur"}
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