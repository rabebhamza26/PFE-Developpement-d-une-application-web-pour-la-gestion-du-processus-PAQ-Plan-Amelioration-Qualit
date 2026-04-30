import React, { useEffect, useState } from "react";
import { getSegments, createSegment, updateSegment, deleteSegment } from "../../services/api";
import "../../styles/segment-management.css";
import { Pencil, Trash2,Plus  } from "lucide-react";


export default function SegmentManagement() {
 
  const [segments, setSegments] = useState([]);
  const [form, setForm] = useState({ nomSegment: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    try {
      setLoading(true);
      const res = await getSegments();
      setSegments(res.data || []);
    } catch (err) {
      setError("Erreur de synchronisation");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({ nomSegment: "" });
    setEditingId(null);
    setOpenModal(true);
  };

  const openEditModal = (segment) => {
    setForm({ nomSegment: segment.nomSegment });
    setEditingId(segment.idSegment ?? segment.id);
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setForm({ nomSegment: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await updateSegment(editingId, form);
      } else {
        await createSegment(form);
      }

      closeModal();
      loadSegments();
    } catch (err) {
      setError("Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const removeSegment = async (id) => {
    if (!window.confirm("Supprimer ce segment ?")) return;

    try {
      await deleteSegment(id);
      loadSegments();
    } catch {
      setError("Erreur lors de la suppression");
    }
  };

  return (
    <div className="admin-content-fade p-4 md:p-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between mb-20 gap-4"> {/* Added space between add button and list */}
       <div className="leoni-header">
  <h2 className="header-title">Gestion des Segments</h2>
</div>

       <button onClick={openAddModal} className="btn-primary">
  <Plus size={18} strokeWidth={2.5} />
  Nouveau Segment
</button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* ✅ ESPACE AJOUTÉ ENTRE LE BOUTON ET LA TABLE */}
      <div className="table-spacer" />

      {/* TABLE */}
      <div className="table-wrapper shadow-lg rounded-xl">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom Segment</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="text-center py-6">
                  Chargement...
                </td>
              </tr>
            ) : segments.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-6 text-gray-400">
                  Aucun segment trouvé
                </td>
              </tr>
            ) : (
              segments.map((s) => {
                const id = s.idSegment ?? s.id;
                return (
                  <tr key={id}>
                    <td>{id}</td>

                    <td className="font-semibold text-[#002857]">
                      {s.nomSegment}
                    </td>

                    {/* ✅ BOUTONS MODIFIER ET SUPPRIMER CÔTE À CÔTE */}
                    <td>
                      <div className="action-group">
                        <button
    onClick={() => openEditModal(s)}
    className="action-btn edit-btn"
    title="Modifier"
  >
    <Pencil size={18} strokeWidth={2.5} />
  </button>

  <button
    onClick={() => removeSegment(id)}
    className="action-btn delete-btn"
    title="Supprimer"
  >
    <Trash2 size={18} strokeWidth={2.5} />
  </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            {/* HEADER */}
            <div className="modal-header">
              {editingId ? "Modifier Segment" : "Nouveau Segment"}
              <button onClick={closeModal}>✖</button>
            </div>

            {/* BODY */}
            <div className="modal-body">
              <form onSubmit={handleSubmit}>

                <input
                  className="modal-input"
                  name="nomSegment"
                  value={form.nomSegment}
                  onChange={(e) =>
                    setForm({ ...form, nomSegment: e.target.value })
                  }
                  placeholder="Nom du segment"
                  required
                />

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn-cancel"
                  >
                    Annuler
                  </button>

                  <button
                    disabled={saving}
                    className="btn-submit"
                  >
                    {saving ? "..." : editingId ? "Modifier" : "Ajouter"}
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
