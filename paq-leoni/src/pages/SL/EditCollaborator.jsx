import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collaboratorService } from "../../services/api";
import "../../styles/collaborator.css";

const SEGMENT_OPTIONS = ["SEG-01", "SEG-02", "SEG-03", "SEG-04"];

export default function EditCollaborator() {
    const { matricule } = useParams();
    const [formData, setFormData] = useState({
        matricule: "",
        name: "",
        prenom: "",
        segment: "",
        hireDate: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    /**
     * Charge les données du collaborateur au montage
     */
    useEffect(() => {
        loadCollaborator();
    }, [matricule]);

    /**
     * Récupère les informations du collaborateur à modifier
     */
    const loadCollaborator = async () => {
        try {
            setLoading(true);
            const response = await collaboratorService.getById(matricule);
            const data = response.data;
            
            setFormData({
                matricule: data.matricule,
                name: data.name || "",
                prenom: data.prenom || "",
                segment: data.segment || "",
                hireDate: data.hireDate ? data.hireDate.slice(0, 10) : "",
            });
        } catch (err) {
            console.error("Erreur:", err);
            setError("Impossible de charger les informations du collaborateur");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Gère les changements dans les champs du formulaire
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    /**
     * Gère la soumission du formulaire
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation des champs obligatoires
        if (!formData.name || !formData.prenom || !formData.segment || !formData.hireDate) {
            setError("Tous les champs sont obligatoires");
            return;
        }

        // Validation de la date
        const hireDate = new Date(formData.hireDate);
        const today = new Date();
        if (hireDate > today) {
            setError("La date d'embauche ne peut pas être dans le futur");
            return;
        }

        try {
            setSubmitting(true);
            
            const payload = {
                matricule: formData.matricule,
                name: formData.name.trim(),
                prenom: formData.prenom.trim(),
                segment: formData.segment,
                hireDate: formData.hireDate,
            };
            
            await collaboratorService.update(matricule, payload);
            setSuccess("Collaborateur modifié avec succès !");
            
            // Redirection après 1.5 secondes
            setTimeout(() => {
                navigate("/collaborateurs");
            }, 1500);
            
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Erreur lors de la mise à jour";
            setError(errorMessage);
            console.error("Erreur:", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-4 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
                <p className="mt-2">Chargement des informations...</p>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="form-container card shadow-sm border-0">
                <div className="card-body p-4 p-md-5">
                    <h2 className="mb-4">
                        <i className="fas fa-edit me-2"></i>
                        Modifier le Collaborateur
                    </h2>

                    {error && (
                        <div className="alert alert-danger alert-dismissible fade show">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                            <button type="button" className="btn-close" onClick={() => setError("")}></button>
                        </div>
                    )}
                    
                    {success && (
                        <div className="alert alert-success alert-dismissible fade show">
                            <i className="fas fa-check-circle me-2"></i>
                            {success}
                            <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-3">
                            <label htmlFor="matricule" className="form-label">Matricule:</label>
                            <input
                                type="text"
                                id="matricule"
                                name="matricule"
                                value={formData.matricule}
                                className="form-control bg-light"
                                disabled
                            />
                            <small className="text-muted">Le matricule ne peut pas être modifié</small>
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="name" className="form-label">
                                Nom <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="prenom" className="form-label">
                                Prénom <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                id="prenom"
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="form-group mb-3">
                            <label htmlFor="segment" className="form-label">
                                Segment <span className="text-danger">*</span>
                            </label>
                            <select
                                id="segment"
                                name="segment"
                                value={formData.segment}
                                onChange={handleChange}
                                className="form-select"
                                required
                            >
                                <option value="">Sélectionner un segment</option>
                                {SEGMENT_OPTIONS.map((segment) => (
                                    <option key={segment} value={segment}>
                                        {segment}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group mb-4">
                            <label htmlFor="hireDate" className="form-label">
                                Date d'embauche <span className="text-danger">*</span>
                            </label>
                            <input
                                type="date"
                                id="hireDate"
                                name="hireDate"
                                value={formData.hireDate}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="form-buttons d-flex flex-column flex-sm-row gap-2">
                            <button 
                                type="submit" 
                                disabled={submitting} 
                                className="btn btn-primary"
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Mise à jour...
                                    </>
                                ) : "Mettre à jour"}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => navigate("/collaborateurs")} 
                                className="btn btn-outline-secondary"
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}