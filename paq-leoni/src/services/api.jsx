// services/api.js
import axios from "axios";





const API = axios.create({
  baseURL: "http://localhost:8083/api",
  headers: {
    "Content-Type": "application/json",
  },
});
 
// ✅ Ajouter automatiquement le token
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
 
// ------------------ dashboard Service ------------------
export const dashboardService = {
  getStats: () => API.get("/dashboard/stats"),
  getSegmentStats: () => API.get("/dashboard/segment-stats"),
  getPerformanceHistory: () => API.get("/dashboard/performance-history"),
  exportReport: (format) => API.get(`/dashboard/export/${format}`, { responseType: "blob" }),
};

// ------------------ SITE SERVICE ------------------
export const siteService = {
    getAll: () => API.get("/sites"),
    getById: (id) => API.get(`/sites/${id}`),
    create: (data) => API.post("/sites", data),
    update: (id, data) => API.put(`/sites/${id}`, data),
    delete: (id) => API.delete(`/sites/${id}`),
  
};

// ------------------ Plant SERVICE ------------------

export const plantService = {
 getAll: () => API.get("/plants"),
    getBySite: (siteId) => API.get(`/plants/site/${siteId}`),
    getById: (id) => API.get(`/plants/${id}`),
    create: (data) => API.post("/plants", data),
    update: (id, data) => API.put(`/plants/${id}`, data),
    delete: (id) => API.delete(`/plants/${id}`),
};

// ------------------ admin SERVICE ------------------

export const userService = {
  getAllUsers: () => API.get("/users"),
  getUserById: (id) => API.get(`/users/${id}`),
  createUser: (data) => API.post("/users", data),
  updateUser: (id, data) => API.put(`/users/${id}`, data),
  deleteUser: (id) => API.delete(`/users/${id}`),

  // ✅ Activer / désactiver
  toggleActive: (id) => API.patch(`/users/${id}/toggle-active`),
   getAllEmails: () => API.get("/users/all"),
   
};

export const getSegments = () => API.get("/segments");
export const createSegment = (segment) => API.post("/segments", segment);
export const updateSegment = (id, segment) => API.put(`/segments/${id}`, segment);
export const deleteSegment = (id) => API.delete(`/segments/${id}`);

// ─── ENTRETIEN POSITIF ───────────────────────────────────────────────────────
export const entretienPositifService = {
  /** GET /entretiens-positifs/sans-faute */
  getSansFaute: () => API.get("/entretiens-positifs/sans-faute"),

  /**
   * POST /entretiens-positifs/envoyer-sl
   * payload: { matricules, slDestinataire, dateEnvoi, message }
   */
  envoyerAuSL: (payload) => API.post("/entretiens-positifs/envoyer-sl", payload),

  /**
   * POST /entretiens-positifs/archiver
   * payload: { matricules }
   */
  archiverEtCreer: (payload) => API.post("/entretiens-positifs/archiver", payload),

  /**
   * GET /entretiens-positifs/export-pdf
   */
  exportPdf: () =>
    axios.get(`${API_BASE_URL}/entretiens-positifs/export-pdf`, {
      responseType: "blob",
      headers: {
        "Content-Type": "application/json",
      },
    }),
};

// Service pour les collaborateurs
export const collaboratorService = {
  getAll: async () => {
    try {
      return await API.get("/collaborators/view");
    } catch (err) {
      return await API.get("/collaborators");
    }
  },
  getById: async (matricule) => {
    try {
      return await API.get(`/collaborators/${matricule}`);
    } catch (err) {
      try {
        return await API.get(`/collaborators/view/${matricule}`);
      } catch (err2) {
        // Fallback: charger la liste et trouver par matricule ou id
        const listRes = await API.get("/collaborators/view");
        const list = Array.isArray(listRes.data) ? listRes.data : listRes.data?.data || [];
        const found =
          list.find((c) => String(c.matricule) === String(matricule)) ||
          list.find((c) => String(c.id ?? c._id) === String(matricule));
        if (found) {
          return { data: found };
        }
        throw err2;
      }
    }
  },
  create: (data) => API.post("/collaborators", data),
  update: (matricule, data) => API.put(`/collaborators/${matricule}`, data),
  delete: (matricule) => API.delete(`/collaborators/${matricule}`),
};

// ------------------ Paq SERVICE ------------------

export const paqService = {
  getByMatricule: (matricule) => API.get(`/paq/${matricule}`),
  getAllByMatricule: (matricule) => API.get(`/paq/history/${matricule}`),
  getAll: () => API.get("/paq/all"),
  getHistory: (matricule, fromDate) =>
    API.get(`/paq/${matricule}/history`, { params: { fromDate } }),
  create: (matricule) => API.post(`/paq/create/${matricule}`),
  createPremierEntretien: (matricule, data) =>
    API.post(`/entretiens/${matricule}`, data),
  createDeuxiemeEntretien: (matricule, data) =>
    API.post(`/paq/${matricule}/deuxieme-entretien`, data),
  createTroisiemeEntretien: (matricule, data) =>
    API.post(`/paq/${matricule}/troisieme-entretien`, data),
  createQuatriemeEntretien: (matricule, data) =>
    API.post(`/paq/${matricule}/quatrieme-entretien`, data),
  createCinquiemeEntretien: (matricule, data) =>
    API.post(`/paq/${matricule}/cinquieme-entretien`, data),
  enregistrerFaute: (matricule, data) => API.post(`/paq/${matricule}/faute`, data),
  upgradeNiveau: (matricule) => API.post(`/paq/${matricule}/upgrade`),
  archive: (matricule) => API.post(`/paq/${matricule}/archive`),
 
 

};


// ------------------ EntretienDecision Service ------------------

export const entretienDecisionService = {
  createEntretienDecision: (matricule, data) => {
    return API.post(`/entretiens-decision/${matricule}`, data);
  },
  getEntretienDecisionByMatricule: (matricule) => {
    return API.get(`/entretiens-decision/matricule/${matricule}`);
  },
  updateEntretienDecision: (matricule, id, data) => {
    return API.put(`/entretiens-decision/${matricule}/${id}`, data);
  },
  deleteEntretienDecision: (id) => {
    return API.delete(`/entretiens-decision/${id}`);
  }
};




// ------------------ entretienDaccordService ------------------
export const entretienDaccordService = {
  create: (matricule, data) => API.post(`/entretiens-daccord/${matricule}`, data),
  update: (matricule, id, data) => API.put(`/entretiens-daccord/${matricule}/${id}`, data),
  getByMatricule: (matricule) => API.get(`/entretiens-daccord/matricule/${matricule}`),
  getById: (id) => API.get(`/entretiens-daccord/${id}`),
  delete: (id) => API.delete(`/entretiens-daccord/${id}`),

  

};



// ------------------ entretienExplicatifService ------------------

const API_URL = "/entretiens";

export const entretienService = {
  create: (matricule, data) => API.post(`${API_URL}/${matricule}`, data),
  update: (matricule, id, data) => API.put(`${API_URL}/${matricule}/${id}`, data),
  getByMatricule: (matricule) => API.get(`${API_URL}/matricule/${matricule}`),
  getById: (id) => API.get(`${API_URL}/${id}`),
  delete: (id) => API.delete(`${API_URL}/${id}`),
};

// ── entretienFinalService ─────────────────────────────────────────────────

export const entretienFinalService = {
  // Crée l'entretien final + met PAQ niveau 5 + historique (côté backend)
  create: (matricule, data) =>
    API.post(`/entretien-final/${matricule}`, data),
 
  // Récupère les entretiens finaux d'un collaborateur
  getByMatricule: (matricule) =>
    API.get(`/entretien-final/${matricule}`),
 
  // Supprime un entretien final
  delete: (id) =>
    API.delete(`/entretien-final/${id}`),
};
 


// notificationService.js
// services/api.js - Ajoutez ces méthodes
export const notificationService = {
    getAll: () => API.get("/notifications"),
    getNonLues: () => API.get("/notifications/non-lues"),
    create: (data) => API.post("/notifications", data),
    marquerLue: (id) => API.put(`/notifications/${id}/lu`),
    marquerToutesLues: () => API.put("/notifications/marquer-toutes-lues"),
    delete: (id) => API.delete(`/notifications/${id}`),
     // Utilisez cet endpoint qui existe dans votre controller
  envoyerNotificationDirecte: (data) => API.post("/notifications/envoyer", data),
};



// ─── ARCHIVES ────────────────────────────────────────────────────────────────
export const archiveService = {
 getAll: () => API.get("/archives"),

getById: (id) => API.get(`/archives/${id}`),

searchByMatricule: (matricule) =>
  API.get("/archives/search", { params: { matricule } }),

getByType: (type) => API.get(`/archives/type/${type}`),

getByMatriculeExact: (matricule) =>
  API.get(`/archives/matricule/${matricule}`),




};

export const entretienMesureService = {
  create: (matricule, data) =>
    API.post(`/entretiens-mesures/${matricule}`, data),

  update: (id, data) =>
    API.put(`/entretiens-mesures/${id}`, data),

  getByMatricule: (matricule) =>
    API.get(`/entretiens-mesures/${matricule}`),

  delete: (id) =>
    API.delete(`/entretiens-mesures/${id}`),
};

export const fauteService = {
  getAll: () => API.get("/fautes"),
  search: (q) => API.get(`/fautes/search?q=${q}`),
  create: (data) => API.post("/fautes", data),
};

export default API;
