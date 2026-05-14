import React, { useEffect, useState } from "react";

import "../../styles/segment-management.css";
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../utils/entretienAlerts";

import {
  getSegments,
  createSegment,
  updateSegment,
  deleteSegment,
  siteService,
  plantService
} from "../../services/api";
import { Pencil, Trash2, Plus, X, Filter, XCircle } from "lucide-react";

export default function SegmentManagement() {
  const [segments, setSegments] = useState([]);
  const [filteredSegments, setFilteredSegments] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nomSegment: "", plantId: "", siteId: "" });
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [plantsBySite, setPlantsBySite] = useState([]);
  
  // Filtres
  const [filterSite, setFilterSite] = useState("");
  const [filterPlant, setFilterPlant] = useState("");
  const [filterPlantsList, setFilterPlantsList] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [segments, filterSite, filterPlant]);

  useEffect(() => {
    if (filterSite) {
      loadFilterPlantsBySite(filterSite);
    } else {
      setFilterPlantsList([]);
      setFilterPlant("");
    }
  }, [filterSite]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [segmentsRes, sitesRes] = await Promise.all([
        getSegments(),
        siteService.getAll(),
      ]);
      setSegments(segmentsRes.data || []);
      setSites(sitesRes.data || []);
    } catch (err) {
      setError("Erreur de chargement");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlantsBySite = async (siteId) => {
    if (!siteId) {
      setPlantsBySite([]);
      return;
    }
    try {
      const response = await plantService.getBySite(siteId);
      setPlantsBySite(response.data || []);
    } catch (err) {
      console.error("Erreur chargement plants:", err);
      setPlantsBySite([]);
    }
  };

  const loadFilterPlantsBySite = async (siteId) => {
    if (!siteId) {
      setFilterPlantsList([]);
      return;
    }
    try {
      const response = await plantService.getBySite(siteId);
      setFilterPlantsList(response.data || []);
    } catch (err) {
      console.error("Erreur chargement plants filtre:", err);
      setFilterPlantsList([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...segments];
    
    if (filterSite) {
      filtered = filtered.filter(segment => segment.siteId === parseInt(filterSite));
    }
    
    if (filterPlant) {
      filtered = filtered.filter(segment => segment.plantId === parseInt(filterPlant));
    }
    
    setFilteredSegments(filtered);
  };

  const resetFilters = () => {
    setFilterSite("");
    setFilterPlant("");
    setFilterPlantsList([]);
  };

  const openAddModal = () => {
    setForm({ nomSegment: "", plantId: "", siteId: "" });
    setSelectedSiteId("");
    setPlantsBySite([]);
    setEditingId(null);
    setOpenModal(true);
  };

  const openEditModal = async (segment) => {
    if (segment.siteId) {
      setSelectedSiteId(segment.siteId.toString());
      await loadPlantsBySite(segment.siteId);
    }
    
    setForm({
      nomSegment: segment.nomSegment,
      plantId: segment.plantId?.toString() || "",
      siteId: segment.siteId?.toString() || ""
    });
    setEditingId(segment.id);
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setForm({ nomSegment: "", plantId: "", siteId: "" });
    setSelectedSiteId("");
    setPlantsBySite([]);
    setEditingId(null);
  };

  const handleSiteChange = async (e) => {
    const siteId = e.target.value;
    setSelectedSiteId(siteId);
    setForm({ ...form, plantId: "", siteId: siteId });
    if (siteId) {
      await loadPlantsBySite(siteId);
    } else {
      setPlantsBySite([]);
    }
  };

  const handlePlantChange = (e) => {
    const plantId = e.target.value;
    setForm({ ...form, plantId: plantId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nomSegment.trim()) {
      await showErrorAlert("Erreur", "Le nom du segment est requis");
      return;
    }

    if (!form.plantId) {
      await showErrorAlert("Erreur", "Veuillez sélectionner un plant");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nomSegment: form.nomSegment.trim(),
        plantId: Number(form.plantId)
      };

      if (editingId) {
        await updateSegment(editingId, payload);
        closeModal();
        await loadAll();
        await showSuccessAlert("Modifié", "Le segment a été modifié avec succès.");
      } else {
        await createSegment(payload);
        closeModal();
        await loadAll();
        await showSuccessAlert("Ajouté", "Le segment a été ajouté avec succès.");
      }
    } catch (err) {
      console.error("Erreur détaillée:", err);
      
      let msg = "Erreur d'enregistrement";
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      
      await showErrorAlert("Impossible", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await showConfirmAlert({
      title: "Supprimer ce segment ?",
      text: "Cette action est irréversible.",
      confirmButtonText: "Supprimer",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteSegment(id);
      await loadAll();
      await showSuccessAlert("Supprimé", "Le segment a été supprimé.");
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur de suppression";
      await showErrorAlert("Impossible", msg);
    }
  };

  return (
    <div className="segment-page admin-content-fade">
      <div className="p-4 md:p-8">
        {/* HEADER */}
        <div className="segment-header">
          <div className="leoni-header">
            <h2 className="header-title">Gestion des Segments</h2>
          </div>
          <button onClick={openAddModal} className="btn-primary">
            <Plus size={20} strokeWidth={2.5} />
            Nouveau Segment
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="segment-alert">
            <span>{error}</span>
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* FILTRES */}
        <div className="filters-section" style={{
          background: "white",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <Filter size={20} color="#002857" />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#002857" }}>Filtrer les segments</h3>
            {(filterSite || filterPlant) && (
              <button
                onClick={resetFilters}
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "#6b7280"
                }}
              >
                <XCircle size={14} />
                Réinitialiser
              </button>
            )}
          </div>
          
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px" }}>
                Filtrer par site
              </label>
              <select
                className="form-select"
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="">Tous les sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#6b7280", marginBottom: "6px" }}>
                Filtrer par plant
              </label>
              <select
                className="form-select"
                value={filterPlant}
                onChange={(e) => setFilterPlant(e.target.value)}
                disabled={!filterSite}
                style={{ width: "100%" }}
              >
                <option value="">Tous les plants</option>
                {filterPlantsList.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>
              {!filterSite && (
                <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px" }}>
                  ⚠ Sélectionnez d'abord un site
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div style={{
                padding: "8px 16px",
                background: "#f3f4f6",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#374151"
              }}>
                {filteredSegments.length} segment(s) trouvé(s)
              </div>
            </div>
          </div>
        </div>

        <div className="table-spacer" />

        {/* SEGMENT CARDS */}
        <div className="segment-grid">
          {loading ? (
            <div className="loading-container" style={{ width: "100%" }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '16px', color: '#64748b' }}>Chargement...</p>
            </div>
          ) : filteredSegments.length === 0 ? (
            <div className="loading-container" style={{ width: "100%" }}>
              <p style={{ marginTop: '16px', color: '#94a3b8' }}>
                {segments.length === 0 ? "Aucun segment trouvé" : "Aucun segment ne correspond aux filtres"}
              </p>
            </div>
          ) : (
            filteredSegments.map((segment) => (
              <div key={segment.id} className="segment-card">
                <div className="segment-card-top">
                  <div>
                    <p className="segment-card-title">{segment.nomSegment || '—'}</p>
                    <div className="segment-card-meta">
                      <span className="segment-tag">Plant: {segment.plantName || '—'}</span>
                      <span className="segment-tag">Site: {segment.siteName || '—'}</span>
                    </div>
                  </div>
                  <div className="segment-card-actions">
                    <button
                      onClick={() => openEditModal(segment)}
                      className="sm-icon-btn sm-icon-edit"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(segment.id)}
                      className="sm-icon-btn sm-icon-delete"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL POPUP */}
        {openModal && (
          <div className="modal-overlay-modern" onClick={closeModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-modern">
                <h3>{editingId ? "Modifier le Segment" : "Nouveau Segment"}</h3>
                <button onClick={closeModal} className="modal-close-btn">
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body-modern">
                <form onSubmit={handleSubmit} className="modal-form">
                  <div className="form-group">
                    <label className="form-label">
                      Nom du segment <span className="required"></span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.nomSegment}
                      onChange={(e) => setForm({ ...form, nomSegment: e.target.value })}
                      placeholder=""
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Site <span className="required"></span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedSiteId}
                      onChange={handleSiteChange}
                      required
                    >
                      <option value="">Sélectionnez un site</option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Plant <span className="required"></span>
                    </label>
                    <select
                      className="form-select"
                      value={form.plantId}
                      onChange={handlePlantChange}
                      disabled={!selectedSiteId}
                      required
                    >
                      <option value="">Sélectionnez un plant</option>
                      {plantsBySite.map((plant) => (
                        <option key={plant.id} value={plant.id}>
                          {plant.name}
                        </option>
                      ))}
                    </select>
                    {!selectedSiteId && (
                      <div className="form-hint warning">
                        ⚠ Veuillez d'abord sélectionner un site
                      </div>
                    )}
                    {selectedSiteId && plantsBySite.length === 0 && (
                      <div className="form-hint error">
                        ⚠ Aucun plant trouvé pour ce site
                      </div>
                    )}
                  </div>

                  <div className="modal-actions-modern">
                    <button type="button" onClick={closeModal} className="btn-cancel-modern">
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !selectedSiteId || !form.plantId || !form.nomSegment.trim()}
                      className="btn-submit-modern"
                    >
                      {saving ? "Enregistrement..." : (editingId ? "Modifier" : "Ajouter")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}