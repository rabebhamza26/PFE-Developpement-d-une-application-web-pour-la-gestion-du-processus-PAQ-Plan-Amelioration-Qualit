import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collaboratorService, paqService } from "../../services/api";
import "../../styles/paq-dossier.css";

export default function PaqDossier() {
    const { matricule } = useParams();
    const navigate = useNavigate();

    const [collaborator, setCollaborator] = useState(null);
    const [currentPaq, setCurrentPaq] = useState(null);
    const [historicalPaqs, setHistoricalPaqs] = useState([]);
    const [historique, setHistorique] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showEntretienModal, setShowEntretienModal] = useState(false);
    const [showFauteModal, setShowFauteModal] = useState(false);
    const [entretienNotes, setEntretienNotes] = useState("");
    const [fauteDetail, setFauteDetail] = useState("");
    const [selectedEntretien, setSelectedEntretien] = useState(null);
    const [actionMessage, setActionMessage] = useState("");
    const [selectedHistoricalPaq, setSelectedHistoricalPaq] = useState(null);

    useEffect(() => {
        loadData();
    }, [matricule]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            
            const collabRes = await collaboratorService.getById(matricule);
            setCollaborator(collabRes.data);
            
            try {
                const paqsRes = await paqService.getAllByMatricule(matricule);
                const paqs = paqsRes.data || [];
                
                const active = paqs.find(p => p.actif === true && p.archived === false);
                const historical = paqs.filter(p => p.archived === true || p.actif === false);
                
                setCurrentPaq(active);
                setHistoricalPaqs(historical);
                
                if (active?.historique) {
                    try {
                        const history = JSON.parse(active.historique);
                        setHistorique(history);
                    } catch (e) {
                        setHistorique([]);
                    }
                } else {
                    setHistorique([]);
                }
            } catch (err) {
                if (err.response?.status === 404) {
                    setCurrentPaq(null);
                    setHistoricalPaqs([]);
                } else {
                    throw err;
                }
            }
        } catch (err) {
            setError("Impossible de charger les donnees");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const viewHistoricalPaq = (paq) => {
        setSelectedHistoricalPaq(paq);
        try {
            const history = JSON.parse(paq.historique || "[]");
            setHistorique(history);
        } catch (e) {
            setHistorique([]);
        }
    };
    
    const closeHistoricalView = () => {
        setSelectedHistoricalPaq(null);
        loadData();
    };

    const createPaq = async () => {
        try {
            setLoading(true);
            const res = await paqService.create(matricule);
            if (res.data) {
                setCurrentPaq(res.data);
                if (res.data.historique) {
                    setHistorique(JSON.parse(res.data.historique));
                }
                setActionMessage("Dossier PAQ cree avec succes !");
                setTimeout(() => setActionMessage(""), 3000);
                await loadData();
                navigate(`/paq-dossier/${matricule}`);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de la creation";
            setError(errorMsg);
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const enregistrerFaute = async () => {
        try {
            setLoading(true);
            const res = await paqService.enregistrerFaute(matricule, { 
                detail: fauteDetail || "Faute professionnelle",
                type: "STANDARD"
            });
            if (res.data) {
                setCurrentPaq(res.data.paq || res.data);
                if (res.data.paq?.historique) {
                    setHistorique(JSON.parse(res.data.paq.historique));
                }
                setShowFauteModal(false);
                setFauteDetail("");
                setActionMessage(res.data.message || "Faute enregistree");
                setTimeout(() => setActionMessage(""), 3000);
                await loadData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Erreur lors de l'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    const upgradeNiveau = async () => {
        try {
            setLoading(true);
            const res = await paqService.upgradeNiveau(matricule);
            if (res.data) {
                setCurrentPaq(res.data.paq || res.data);
                if (res.data.paq?.historique) {
                    setHistorique(JSON.parse(res.data.paq.historique));
                }
                setActionMessage(res.data.message || "Niveau augmente !");
                setTimeout(() => setActionMessage(""), 3000);
                await loadData();
            }
        } catch (err) {
            alert(err.response?.data?.message || "Erreur");
        } finally {
            setLoading(false);
        }
    };

    const archiverPaq = async () => {
        if (window.confirm("Etes-vous sur de vouloir archiver ce dossier ?")) {
            try {
                setLoading(true);
                const res = await paqService.archive(matricule);
                if (res.data) {
                    setCurrentPaq(null);
                    setActionMessage("Dossier archive");
                    setTimeout(() => setActionMessage(""), 3000);
                    await loadData();
                }
            } catch (err) {
                alert(err.response?.data?.message || "Erreur");
            } finally {
                setLoading(false);
            }
        }
    };

    const getProchainEntretien = () => {
        if (!currentPaq) return null;
        if (currentPaq.statut === "CLOTURE" || currentPaq.archived) return null;
        if (currentPaq.niveau === 0) return { niveau: 1, nom: "Entretien explicatif", route: `/entretien-explicatif/${matricule}` };
        if (currentPaq.niveau === 1) return { niveau: 2, nom: "Entretien d'accord", route: `/entretien-daccord/${matricule}` };
        if (currentPaq.niveau === 2) return { niveau: 3, nom: "Entretien de mesure", route: `/entretien-de-mesure/${matricule}` };
        if (currentPaq.niveau === 3) return { niveau: 4, nom: "Entretien de decision", route: `/entretien-de-decision/${matricule}` };
        if (currentPaq.niveau === 4) return { niveau: 5, nom: "Entretien final", route: `/entretien-final/${matricule}` };
        return null;
    };

    const isBlocked = currentPaq?.statut === "CLOTURE" || currentPaq?.archived;
    const prochainEntretien = getProchainEntretien();
    const peutCreerPaq = collaborator && !currentPaq;

    const peutCreerPaqApres6Mois = () => {
        if (!collaborator || !collaborator.hireDate) return false;
        const hireDate = new Date(collaborator.hireDate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return hireDate <= sixMonthsAgo;
    };

    if (loading) {
        return (
            <div className="paq-loading">
                <div className="spinner-border text-primary"></div>
                <p>Chargement...</p>
            </div>
        );
    }

    const formatHistoriqueDetail = (detail) => {
        if (!detail) return detail;
        const match = detail.match(/Niveau\s+desc\w*\s+de\s+(\d+)\s+à\s+(\d+)/i);
        if (!match) return detail;
        const from = Number(match[1]);
        const to = Number(match[2]);
        if (Number.isNaN(from) || Number.isNaN(to)) return detail;
        if (from < to) {
            return detail.replace(match[0], `Niveau descendant de ${to} à ${from}`);
        }
        return detail.replace(match[0], `Niveau descendant de ${from} à ${to}`);
    };

    return (
        <div className="paq-shell">
            <div className="paq-header">
                <button onClick={() => navigate("/collaborateurs")} className="btn btn-secondary">
                    &larr; Retour
                </button>
                <h1>Dossier PAQ</h1>
                <div className="paq-actions">
                    {peutCreerPaq && (
                        <button 
                            onClick={createPaq} 
                            className="btn btn-success"
                            disabled={!peutCreerPaqApres6Mois()}
                            title={!peutCreerPaqApres6Mois() ? "Necessite 6 mois d'anciennete" : ""}
                        >
                            Creer PAQ
                        </button>
                    )}
                    {currentPaq && !isBlocked && (
                        <>
                            {prochainEntretien && (
                                <button 
                                    onClick={() => navigate(prochainEntretien.route)} 
                                    className="btn btn-primary"
                                >
                                    {prochainEntretien.nom}
                                </button>
                            )}
                            <button 
                                onClick={() => setShowFauteModal(true)} 
                                className="btn btn-warning"
                            >
                                Enregistrer Faute
                            </button>
                            <button onClick={archiverPaq} className="btn btn-secondary">
                                Archiver
                            </button>
                        </>
                    )}
                </div>
            </div>

            {actionMessage && (
                <div className="alert alert-success alert-dismissible fade show">
                    {actionMessage}
                    <button type="button" className="btn-close" onClick={() => setActionMessage("")}></button>
                </div>
            )}

            {error && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                </div>
            )}

            {isBlocked && (
                <div className="alert alert-warning paq-banner">
                    Ce dossier est {currentPaq?.statut === "CLOTURE" ? "cloture" : "archive"} (lecture seule)
                </div>
            )}

            {collaborator && (
                <div className="paq-meta card">
                    <div className="card-body">
                        <h3 className="card-title">Informations collaborateur</h3>
                        <div className="row">
                            <div className="col-md-6">
                                <p><strong>Matricule :</strong> {collaborator.matricule}</p>
                                <p><strong>Nom :</strong> {collaborator.name} {collaborator.prenom}</p>
                                <p><strong>Segment :</strong> {collaborator.segment}</p>
                            </div>
                            <div className="col-md-6">
                                <p><strong>Date embauche :</strong> {collaborator.hireDate}</p>
                                <p><strong>Statut :</strong> 
                                    <span className={`badge ${collaborator.status === "ACTIF" ? "bg-success" : "bg-secondary"} ms-2`}>
                                        {collaborator.status}
                                    </span>
                                </p>
                                {!currentPaq && !peutCreerPaqApres6Mois() && (
                                    <p className="text-warning">
                                        PAQ disponible apres 6 mois d'anciennete
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {currentPaq && !selectedHistoricalPaq && (
                <div className="paq-niveau card">
                    <div className="card-body text-center">
                        <h3>Niveau actuel</h3>
                        <div className="niveau-display">
                            <div className={`niveau-value ${currentPaq.niveau === 0 ? "text-warning" : "text-primary"}`}>
                                {currentPaq.niveau}
                            </div>
                            <div className="niveau-max">/ 5</div>
                        </div>
                        <div className="niveau-bar-large">
                            {[1, 2, 3, 4, 5].map(n => (
                                <span key={n} className={n <= currentPaq.niveau ? "active" : ""}></span>
                            ))}
                        </div>
                        <p className="mt-2">
                            <strong>Periode :</strong> {currentPaq.dateCreation} &rarr; {currentPaq.dateFin}
                        </p>
                        <p>
                            {currentPaq.niveau === 0 && "Dossier cree, en attente du premier entretien"}
                            {currentPaq.niveau === 1 && "Premier entretien realise"}
                            {currentPaq.niveau === 2 && "Deuxieme entretien realise"}
                            {currentPaq.niveau === 3 && "Troisieme entretien realise"}
                            {currentPaq.niveau === 4 && "Quatrieme entretien realise"}
                            {currentPaq.niveau === 5 && "Dossier cloture avec succes"}
                        </p>
                        {currentPaq.statut === "CRITIQUE" && (
                            <div className="alert alert-danger mt-2">
                                STATUT CRITIQUE - Action immediate requise !
                            </div>
                        )}
                        {currentPaq.derniereFaute && (
                            <p className="text-muted small">
                                Derniere faute: {currentPaq.derniereFaute}
                            </p>
                        )}
                    </div>
                </div>
            )}
            
            {selectedHistoricalPaq && (
                <div className="paq-niveau card historical">
                    <div className="card-body text-center">
                        <h3>Dossier PAQ Historique</h3>
                        <div className="niveau-display">
                            <div className="niveau-value text-secondary">
                                {selectedHistoricalPaq.niveau}
                            </div>
                            <div className="niveau-max">/ 5</div>
                        </div>
                        <div className="niveau-bar-large">
                            {[1, 2, 3, 4, 5].map(n => (
                                <span key={n} className={n <= selectedHistoricalPaq.niveau ? "active" : ""}></span>
                            ))}
                        </div>
                        <p className="mt-2">
                            <strong>Periode :</strong> {selectedHistoricalPaq.dateCreation} &rarr; {selectedHistoricalPaq.dateFin}
                        </p>
                        <p className="mt-2">
                            <strong>Statut final :</strong> {selectedHistoricalPaq.statut}
                        </p>
                        <button onClick={closeHistoricalView} className="btn btn-primary mt-2">
                            Retour au dossier actif
                        </button>
                    </div>
                </div>
            )}

            {historicalPaqs.length > 0 && !selectedHistoricalPaq && (
                <section className="paq-block">
                    <h3>Dossiers PAQ precedents</h3>
                    <div className="table-responsive">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>Periode</th>
                                    <th>Niveau final</th>
                                    <th>Statut</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historicalPaqs.map((paq, idx) => (
                                    <tr key={idx}>
                                        <td>{paq.dateCreation} &rarr; {paq.dateFin}</td>
                                        <td>{paq.niveau}/5</td>
                                        <td>
                                            <span className={`badge ${
                                                paq.statut === "CLOTURE" ? "bg-success" : "bg-secondary"
                                            }`}>
                                                {paq.statut}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => viewHistoricalPaq(paq)}
                                                className="btn btn-sm btn-outline-info"
                                            >
                                                Voir details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            <section className="paq-block">
                <h3>Historique des evenements</h3>
                {historique.length === 0 ? (
                    <p className="text-muted">Aucun historique disponible</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Action</th>
                                    <th>Detail</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historique.map((h, i) => (
                                    <tr key={i}>
                                        <td>{h.date}</td>
                                        <td>
                                            <span className={`badge ${
                                                h.action.includes("entretien") ? "bg-primary" :
                                                h.action.includes("Faute") ? "bg-danger" :
                                                h.action.includes("Augmentation") ? "bg-success" :
                                                h.action.includes("Creation") ? "bg-info" :
                                                "bg-secondary"
                                            }`}>
                                                {h.action}
                                            </span>
                                        </td>
                                        <td>{formatHistoriqueDetail(h.detail)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {showFauteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Enregistrer une faute</h3>
                        <div className="form-group">
                            <label>Choisir la faute :</label>
                            <select
                                className="form-select"
                                value={fauteDetail}
                                onChange={(e) => setFauteDetail(e.target.value)}
                            >
                                <option value="">Selectionner</option>
                                <option value="Collage inverse">Collage inverse</option>
                                <option value="Erreur montage">Erreur montage</option>
                                <option value="Defaut qualite">Defaut qualite</option>
                                <option value="Non respect consigne">Non respect consigne</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div className="alert alert-warning mt-2">
                            Une faute fera descendre le niveau d'un cran (minimum 0)
                        </div>
                        <div className="modal-buttons">
                            <button onClick={enregistrerFaute} className="btn btn-warning">
                                Valider
                            </button>
                            <button 
                                onClick={() => {
                                    setShowFauteModal(false);
                                    setFauteDetail("");
                                }}
                                className="btn btn-secondary"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
