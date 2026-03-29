import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collaboratorService } from "../../services/api";
import "../../styles/collaborator.css";

const SEGMENT_OPTIONS = ["SEG-01", "SEG-02", "SEG-03", "SEG-04"];

export default function AddCollaborator() {
    const [formData, setFormData] = useState({
        matricule: "",
        name: "",      // Nom complet
        prenom: "",
        segment: "",
        hireDate: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    /**
     * Gère les changements dans les champs du formulaire
     * Validation spéciale pour le matricule (uniquement chiffres, 8 caractères)
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === "matricule") {
            // Uniquement des chiffres, maximum 8 caractères
            const digitsOnly = value.replace(/\D/g, "").slice(0, 8);
            setFormData({ ...formData, [name]: digitsOnly });
            return;
        }
        
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
        if (!formData.matricule || !formData.name || !formData.prenom || 
            !formData.segment || !formData.hireDate) {
            setError("Tous les champs sont obligatoires");
            return;
        }

        // Validation du format du matricule
        if (!/^\d{8}$/.test(formData.matricule)) {
            setError("Le matricule doit contenir exactement 8 chiffres.");
            return;
        }

        // Validation de la date d'embauche
        const hireDate = new Date(formData.hireDate);
        const today = new Date();
        if (hireDate > today) {
            setError("La date d'embauche ne peut pas être dans le futur");
            return;
        }

        try {
            setLoading(true);
            
            // Construction du payload pour l'API
            const payload = {
                matricule: formData.matricule,
                name: formData.name.trim(),
                prenom: formData.prenom.trim(),
                segment: formData.segment,
                hireDate: formData.hireDate,
            };
            
            await collaboratorService.create(payload);
            setSuccess("Collaborateur ajouté avec succès !");
            
            // Redirection après 1.5 secondes
            setTimeout(() => {
                navigate("/collaborateurs");
            }, 1500);
            
        } catch (err) {
            const errorMessage = err.response?.data?.message || 
                                err.response?.data?.error ||
                                "Erreur lors de l'ajout du collaborateur";
            setError(errorMessage);
            console.error("Erreur:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4">
            <div className="form-container card shadow-sm border-0">
                <div className="card-body p-4 p-md-5">
                    <h2 className="mb-4">Ajouter un Collaborateur</h2>

                    {error && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                            <button type="button" className="btn-close" onClick={() => setError("")}></button>
                        </div>
                    )}
                    
                    {success && (
                        <div className="alert alert-success alert-dismissible fade show" role="alert">
                            <i className="fas fa-check-circle me-2"></i>
                            {success}
                            <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-3">
                            <label htmlFor="matricule" className="form-label">
                                Matricule <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                id="matricule"
                                name="matricule"
                                value={formData.matricule}
                                onChange={handleChange}
                                inputMode="numeric"
                                pattern="\d{8}"
                                maxLength={8}
                                className="form-control"
                                placeholder="Entrez 8 chiffres"
                                required
                            />
                            <small className="text-muted">8 chiffres uniquement</small>
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
                                placeholder="Nom du collaborateur"
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
                                placeholder="Prénom du collaborateur"
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
                                disabled={loading} 
                                className="btn btn-primary"
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Enregistrement...
                                    </>
                                ) : "Ajouter"}
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