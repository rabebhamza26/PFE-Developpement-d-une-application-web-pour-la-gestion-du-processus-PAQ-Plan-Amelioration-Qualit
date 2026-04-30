import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { plantService, siteService } from "../../services/api";
import "../../styles/plant-management.css";
import { FiEdit, FiTrash2 } from "react-icons/fi";

// Garantit toujours un tableau peu importe ce que le backend renvoie
const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    // Spring peut renvoyer { content: [...] } (pagination) ou un objet seul
    if (Array.isArray(data.content)) return data.content;
    // Un seul objet → l'envelopper
    if (data.id !== undefined) return [data];
  }
  return [];
};

export default function PlantManagement() {
  const [searchParams] = useSearchParams();
  const siteIdParam = searchParams.get("siteId");

  const [plants, setPlants] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(siteIdParam || "");
  const [form, setForm] = useState({ name: "", siteId: siteIdParam || "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => { loadSites(); }, []);
  useEffect(() => { loadPlants(); }, [selectedSiteId]);

  const loadSites = async () => {
    try {
      const res = await siteService.getAll();
      setSites(toArray(res.data));
    } catch {
      setSites([]);
    }
  };

  const loadPlants = async () => {
    try {
      setLoading(true);
      setError("");
      const res = selectedSiteId
        ? await plantService.getBySite(selectedSiteId)
        : await plantService.getAll();
      setPlants(toArray(res.data));
    } catch {
      setError("Erreur de chargement des plants");
      setPlants([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({ name: "", siteId: selectedSiteId || "" });
    setEditingId(null);
    setError("");
    setOpenModal(true);
  };

  const openEditModal = (plant) => {
    setForm({
      name: plant.name || "",
      siteId: plant.siteId?.toString() || "",
      
    });
    setEditingId(plant.id);
    setError("");
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setForm({ name: "", siteId: selectedSiteId || "" });
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Le nom est obligatoire."); return; }
    if (!form.siteId)       { setError("Veuillez sélectionner un site."); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        site: { id: Number(form.siteId) },
      };
      if (editingId) {
        await plantService.update(editingId, payload);
      } else {
        await plantService.create(payload);
      }
      closeModal();
      loadPlants();
    } catch {
      setError("Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce plant ?")) return;
    try {
      await plantService.delete(id);
      loadPlants();
    } catch {
      setError("Erreur lors de la suppression");
    }
  };

const getSiteName = (plant) => {
  const site = sites.find(s => s.id === plant.siteId);
  return plant.siteName || "–";
};
  const currentSiteName = sites.find(
    (s) => s.id?.toString() === selectedSiteId
  )?.name;

  return (
    <div className="pm-page">

      {/* ── HEADER ── */}
      <div className="pm-header">
        <div className="pm-header-text">
          <h1 className="pm-header-title">Gestion des Plants</h1>
         
        </div>
        <div className="pm-header-stat">
          <span className="pm-stat-val">{plants.length}</span>
          <span className="pm-stat-lbl">Plant{plants.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="pm-toolbar">
        <div className="pm-filter-wrap">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14" className="pm-filter-icon">
            <path d="M1 3h14M3 8h10M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <select
            className="pm-select"
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
          >
            <option value="">Tous les sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <button className="pm-btn-add" onClick={openAddModal}>
          <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Nouveau Plant
        </button>
      </div>

      {/* ── ERROR ── */}
      {error && !openModal && (
        <div className="pm-alert">{error}</div>
      )}

      {/* ── TABLE ── */}
      <div className="pm-card">
        <div className="pm-card-header">
          <h2>Liste des plants</h2>
          <span className="pm-badge">
            {plants.length} plant{plants.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="pm-table-wrap">
          <table className="pm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom du plant</th>
                <th>Site</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan="4" className="pm-td-skel">
                      <div className="pm-skel-row" />
                    </td>
                  </tr>
                ))
              ) : plants.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="pm-td-empty">
                      <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
                        <circle cx="24" cy="24" r="20" stroke="currentColor"
                          strokeWidth="1.5" opacity=".3"/>
                        <path d="M24 16v8M24 30h.01" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" opacity=".5"/>
                      </svg>
                      <span>Aucun plant trouvé</span>
                    </div>
                  </td>
                </tr>
              ) : (
                plants.map((plant) => (
                  <tr key={plant.id}>
                    <td className="pm-td-id">#{plant.id}</td>
                    <td className="pm-td-name">{plant.name}</td>
                    <td>
                      <span className="pm-site-badge">
                        <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
                          <rect x="1" y="6" width="2.5" height="5" rx=".5"
                            fill="currentColor" opacity=".8"/>
                          <rect x="4.5" y="4" width="2.5" height="7" rx=".5"
                            fill="currentColor"/>
                          <rect x="8" y="5.5" width="2.5" height="5.5" rx=".5"
                            fill="currentColor" opacity=".7"/>
                        </svg>
                        {getSiteName(plant)}
                      </span>
                    </td>
                    <td>
                      <div className="pm-actions">
                        <button
                          className="pm-action-btn pm-edit"
                          title="Modifier"
                          onClick={() => openEditModal(plant)}
                        >
                          <FiEdit size={14} />

                        </button>
                        <button
                          className="pm-action-btn pm-delete"
                          title="Supprimer"
                          onClick={() => handleDelete(plant.id)}
                        >
                           <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL ── */}
      {openModal && (
        <div
          className="pm-overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="pm-modal">
            <div className="pm-modal-header">
              <div className="pm-modal-icon">
                {editingId ? (
                  <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                    <path d="M14 3l3 3L6 17H3v-3L14 3z" stroke="currentColor"
                      strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M10 6v8M6 10h8" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <div>
                <h3>{editingId ? "Modifier le plant" : "Nouveau plant"}</h3>
                <p>
                  {editingId
                    ? "Mettez à jour les informations."
                    : "Associez un plant à un site."}
                </p>
              </div>
              <button className="pm-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="pm-modal-body">
              {error && <div className="pm-alert pm-alert-modal">{error}</div>}

              <form onSubmit={handleSubmit}>
                {/* Sélecteur de site */}
                <div className="pm-field">
                  <label>
                    Site <span className="pm-required">*</span>
                  </label>
                  <select
                    className="pm-input"
                    value={form.siteId}
                    onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                    required
                  >
                    <option value="">— Choisir un site —</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Nom du plant */}
                <div className="pm-field">
                  <label>
                    Nom du plant <span className="pm-required">*</span>
                  </label>
                  <input
                    className="pm-input"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex : Plant Nord A"
                    required
                    autoFocus
                  />
                </div>

                <div className="pm-modal-footer">
                  <button
                    type="button"
                    className="pm-btn-cancel"
                    onClick={closeModal}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="pm-btn-submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Enregistrement…"
                      : editingId
                      ? "Enregistrer"
                      : "Créer le plant"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
