import React, { useEffect, useState } from "react";
import { getSegments, createSegment, updateSegment, deleteSegment } from "../../services/api";

export default function SegmentManagement() {
  const [segments, setSegments] = useState([]);
  const [form, setForm] = useState({ nomSegment: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSegments();
      setSegments(res.data || []);
    } catch (err) {
      setError("Erreur lors du chargement des segments: " + (err.response?.data?.message || err.message));
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

  const resetForm = () => {
    setForm({ nomSegment: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await updateSegment(editingId, form);
      } else {
        await createSegment(form);
      }
      resetForm();
      loadSegments();
    } catch (err) {
      setError("Erreur lors de l'enregistrement: " + (err.response?.data?.message || err.message));
      console.error("Erreur:", err);
    } finally {
      setSaving(false);
    }
  };

  const editSegment = (segment) => {
    const id = segment.idSegment ?? segment.id;
    setForm({ nomSegment: segment.nomSegment || "" });
    setEditingId(id);
  };

  const removeSegment = async (id) => {
    if (!window.confirm("Supprimer ce segment ?")) return;
    try {
      await deleteSegment(id);
      loadSegments();
    } catch (err) {
      setError("Erreur lors de la suppression: " + (err.response?.data?.message || err.message));
      console.error("Erreur:", err);
    }
  };

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-primary mb-0">
          <i className="fas fa-layer-group me-2"></i>
          Gestion des segments
        </h2>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card mb-4">
        <div className="card-header bg-light">
          <strong>{editingId ? "Modifier un segment" : "Ajouter un segment"}</strong>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-2">
            <div className="col-md-8">
              <label htmlFor="nomSegment" className="form-label">
                Nom du segment
              </label>
              <input
                id="nomSegment"
                name="nomSegment"
                type="text"
                className="form-control"
                placeholder="Nom du segment"
                value={form.nomSegment}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4 d-flex align-items-end gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {editingId ? "Modifier" : "Ajouter"}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={saving}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : segments.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted mb-0">Aucun segment trouve</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((segment) => {
                const id = segment.idSegment ?? segment.id;
                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{segment.nomSegment}</td>
                    <td className="text-center">
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => editSegment(segment)}
                          title="Modifier"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeSegment(id)}
                          title="Supprimer"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
