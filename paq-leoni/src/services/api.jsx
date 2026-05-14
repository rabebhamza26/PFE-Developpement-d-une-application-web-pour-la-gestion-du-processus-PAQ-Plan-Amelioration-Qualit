// src/services/api.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8083";

// ✅ Créez l'instance avec le nom 'API' (majuscules) pour correspondre à vos services
const API = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Intercepteur avec logs pour débogage
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");
  console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
  console.log(`🔑 Token présent: ${!!token}`);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`✅ Authorization: Bearer ${token.substring(0, 20)}...`);
  } else {
    console.warn(`⚠️ Pas de token pour ${config.url}`);
  }
  return config;
}, (error) => {
  console.error("❌ Erreur intercepteur:", error);
  return Promise.reject(error);
});

API.interceptors.response.use(
  (res) => {
    console.log(`✅ Réponse ${res.config.url}:`, res.status);
    return res;
  },
  (error) => {
    console.error(`❌ Erreur ${error.config?.url}:`, error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.warn("Token expiré, redirection vers login");
      sessionStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


// ------------------ dashboard Service ------------------
export const dashboardService = {
 getStats: (params = {}) =>
    API.get("/api/dashboard/stats", { params }),
  getSegmentStats: (params = {}) =>
    API.get("/api/dashboard/segment-stats", { params }),
  getPerformanceHistory: (params = {}) =>
    API.get("/api/dashboard/performance-history", { params }),
  exportReport: (format, params = {}) =>
    API.get(`/api/dashboard/export/${format}`, { responseType: "blob", params }),
};

// ------------------ Auth Service ------------------
export const authService = {
  login: (credentials) => API.post("/api/auth/login", credentials),
  logout: () => API.post("/api/auth/logout"),
   forgotPassword: (data) => API.post("/api/auth/forgot-password", data), // Accepte { email, login }
  adminResetPassword: (data) => API.post("/api/auth/admin/reset-password", data), // Accepte { userId, newPassword }
  getUsers: () => API.get("/api/auth/admin/users"),
};

// ------------------ Site Service ------------------
export const siteService = {
  getAll: () => API.get("/api/sites"),
  getById: (id) => API.get(`/api/sites/${id}`),
  create: (data) => API.post("/api/sites", data),
  update: (id, data) => API.put(`/api/sites/${id}`, data),
  delete: (id) => API.delete(`/api/sites/${id}`),
};

// ------------------ Plant Service ------------------
export const plantService = {
  getAll: () => API.get("/api/plants"),
  getBySite: (siteId) => API.get(`/api/plants/site/${siteId}`),
  getById: (id) => API.get(`/api/plants/${id}`),
  create: (data) => API.post("/api/plants", data),
  update: (id, data) => API.put(`/api/plants/${id}`, data),
  delete: (id) => API.delete(`/api/plants/${id}`),
};

// ------------------ User Service ------------------
export const userService = {
   getAllUsers: () => API.get("/api/users"),
  getUserById: (id) => API.get(`/api/users/${id}`),
  createUser: (data) => API.post("/api/users", data),
  updateUser: (id, data) => API.put(`/api/users/${id}`, data),
  deleteUser: (id) => API.delete(`/api/users/${id}`),
  toggleActive: (id) => API.patch(`/api/users/${id}/toggle-active`),
 getAllEmails: () => API.get("/api/users/emails"), 
  getSlEmails: () => API.get("/api/users/sl/emails"),
  getUsersBySite: () => API.get("/api/users/by-site"),
    
      resetPassword: (userId, data) => API.patch(`/api/users/${userId}/reset-password`, data),
  resetPasswordByAdmin: (userId, newPassword) => 
    API.patch(`/api/users/${userId}/reset-password-admin`, { newPassword }),
};

// ------------------ Segment Service ------------------
export const getSegments = () => API.get("/api/segments");
export const createSegment = (segment) => API.post("/api/segments", segment);
export const updateSegment = (id, segment) => API.put(`/api/segments/${id}`, segment);
export const deleteSegment = (id) => API.delete(`/api/segments/${id}`);

export const getSegmentsBySite = (siteId) => {
    return API.get(`/segments/site/${siteId}`);
};

export const getSegmentsByPlant = (plantId) => {
    return API.get(`/segments/plant/${plantId}`);
};

export const getSegmentsBySiteAndPlant = (siteId, plantId) => {
    return API.get(`/segments/site/${siteId}/plant/${plantId}`);
};

// ------------------ Collaborateur Service ------------------
export const collaboratorService = {
  /**
   * Récupère tous les collaborateurs visibles par le user connecté.
   * @param {Object} options  - { siteId, plantId } optionnels (sélection courante)
   */
  getAll: async ({ siteId, plantId } = {}) => {
    try {
      // Construction des query params
      const params = {};
      if (plantId) params.plantId = plantId;
      else if (siteId) params.siteId = siteId;
 
      return await API.get("/api/collaborators/view", { params });
    } catch (err) {
      console.warn("Erreur /api/collaborators/view :", err);
      return { data: [] };
    }
  },
 
  getById: async (matricule) => {
    try {
      return await API.get(`/api/collaborators/${matricule}`);
    } catch (err) {
      try {
        return await API.get(`/api/collaborators/view/${matricule}`);
      } catch (err2) {
        const listRes = await API.get("/api/collaborators/view");
        const list = Array.isArray(listRes.data) ? listRes.data : listRes.data?.data || [];
        const found =
          list.find((c) => String(c.matricule) === String(matricule)) ||
          list.find((c) => String(c.id ?? c._id) === String(matricule));
        if (found) return { data: found };
        throw err2;
      }
    }
  },
 
  create: (data) => API.post("/api/collaborators", data),
  update: (matricule, data) => API.put(`/api/collaborators/${matricule}`, data),
  delete: (matricule) => API.delete(`/api/collaborators/${matricule}`),
};

// ------------------ PAQ Service ------------------
export const paqService = {
  getByMatricule: (matricule) => API.get(`/api/paq/${matricule}`),
  getAllByMatricule: (matricule) => API.get(`/api/paq/history/${matricule}`),
  getAll: () => API.get("/api/paq/all"),
  getHistory: (matricule, fromDate) => API.get(`/api/paq/${matricule}/history`, { params: { fromDate } }),
  create: (matricule) => API.post(`/api/paq/create/${matricule}`),
  createPremierEntretien: (matricule, data) => API.post(`/api/entretiens/${matricule}`, data),
  createDeuxiemeEntretien: (matricule, data) => API.post(`/api/paq/${matricule}/deuxieme-entretien`, data),
  createTroisiemeEntretien: (matricule, data) => API.post(`/api/paq/${matricule}/troisieme-entretien`, data),
  createQuatriemeEntretien: (matricule, data) => API.post(`/api/paq/${matricule}/quatrieme-entretien`, data),
  createCinquiemeEntretien: (matricule, data) => API.post(`/api/paq/${matricule}/cinquieme-entretien`, data),
  enregistrerFaute: (matricule, data) => API.post(`/api/paq/${matricule}/faute`, data),
  upgradeNiveau: (matricule) => API.post(`/api/paq/${matricule}/upgrade`),
  archive: (matricule) => API.post(`/api/paq/${matricule}/archive`),
};

// ------------------ Entretien Decision Service ------------------
export const entretienDecisionService = {
  create: (matricule, data) => API.post(`/api/entretiens-decision/${matricule}`, data),
  update: (matricule, id, data) => API.put(`/api/entretiens-decision/${matricule}/${id}`, data),
  updateWithNotification: (matricule, id, data) =>
    API.put(`/api/entretiens-decision/${matricule}/${id}`, data),

  // ✅ SL valide (envoi email à HP, SGL et QM_PLANT)
  validerParSL: (matricule, id, data) =>
    API.post(`/api/entretiens-decision/${matricule}/${id}/valider-sl`, data),

  // ✅ HP/SGL valident (1ère validation)
  valider1: (matricule, id, data) =>
    API.post(`/api/entretiens-decision/${matricule}/${id}/valider1`, data),

  // ✅ QM_PLANT valide (2ème validation)
  valider2: (matricule, id, data) =>
    API.post(`/api/entretiens-decision/${matricule}/${id}/valider2`, data),

  getByMatricule: (matricule) => API.get(`/api/entretiens-decision/matricule/${matricule}`),
  getById: (id) => API.get(`/api/entretiens-decision/${id}`),
  delete: (id) => API.delete(`/api/entretiens-decision/${id}`),
  deleteWithNotification: (matricule, id, destinataireEmail, nomCollab) =>
    API.delete(`/api/entretiens-decision/${matricule}/${id}`, {
      data: { destinataireEmail, nomCollab },
    }),
};

// ------------------ Entretien D'accord Service ------------------
export const entretienDaccordService = {
  create: (matricule, data) =>
    API.post(`/api/entretiens-daccord/${matricule}`, data),
 
  update: (matricule, id, data) =>
    API.put(`/api/entretiens-daccord/${matricule}/${id}`, data),
 
  updateWithNotification: (matricule, id, data) =>
    API.put(`/api/entretiens-daccord/${matricule}/${id}`, data),
 
  // ✅ SL soumet pour validation → email à QM_SEGMENT
  validerPremiere: (matricule, id, data) =>
    API.post(`/api/entretiens-daccord/${matricule}/${id}/valider-premiere`, data),
 
  // ✅ QM_SEGMENT valide finalement → email à SL
  valider: (matricule, id, data) =>
    API.post(`/api/entretiens-daccord/${matricule}/${id}/valider`, data),
 
  getByMatricule: (matricule) =>
    API.get(`/api/entretiens-daccord/matricule/${matricule}`),
 
  getById: (id) =>
    API.get(`/api/entretiens-daccord/${id}`),
 
 
};

// ------------------ Entretien Explicatif Service ------------------
const API_URL = "/api/entretiens";

export const entretienService = {
   create: (matricule, data) => API.post(`/api/entretiens/${matricule}?niveau=1`, data),
  update: (matricule, id, data) => API.put(`/api/entretiens/${matricule}/${id}?niveau=1`, data),
  updateWithNotification: (matricule, id, data) =>
    API.put(`/api/entretiens/${matricule}/${id}?niveau=1`, data),
  getByMatricule: (matricule) => API.get(`/api/entretiens/matricule/${matricule}`),
  getById: (id) => API.get(`/api/entretiens/${id}`),
  

  
};

// ------------------ Entretien Final Service ------------------
export const entretienFinalService = {
  create: (matricule, data) => API.post(`/api/entretien-final/${matricule}`, data),
  update: (matricule, id, data) => API.put(`/api/entretien-final/${matricule}/${id}`, data),
 
  valider: (matricule, id, data) =>
    API.post(`/api/entretien-final/${matricule}/${id}/valider`, data),
  getByMatricule: (matricule) => API.get(`/api/entretien-final/${matricule}`),
  delete: (id) => API.delete(`/api/entretien-final/${id}`),
  
};

// ------------------ Entretien Mesure Service ------------------
export const entretienMesureService = {
   // Création (SL uniquement)
  create: (matricule, data) => API.post(`/api/entretiens-mesures/${matricule}`, data),
  
  // Mise à jour (SL uniquement) - utilise l'ID de l'entretien
  update: (matricule, id, data) => API.put(`/api/entretiens-mesures/${matricule}/${id}`, data),
  
  // Validation QM_SEGMENT (1ère validation)
  valider1: (matricule, id, data) =>
    API.post(`/api/entretiens-mesures/${matricule}/${id}/valider1`, data),
  
  // Validation SGL (2ème validation)
  valider2: (matricule, id, data) =>
    API.post(`/api/entretiens-mesures/${matricule}/${id}/valider2`, data),
  
  // Récupération de tous les entretiens
  getByMatricule: (matricule) => API.get(`/api/entretiens-mesures/${matricule}`),

   
 
  getById: (id) =>
    API.get(`/api/entretiens-mesures/${id}`),
 
  
  // Suppression avec notification
  deleteWithNotification: (matricule, id, destinataireEmail, nomCollab) =>
    API.delete(`/api/entretiens-mesures/${matricule}/${id}`, {
      data: { destinataireEmail, nomCollab }
    }),

     createWithNotification: (matricule, data, expediteurEmail) => {
    return API.post(`/api/entretiens-mesures/${matricule}/with-notification`, data, {
      params: { expediteurEmail }
    });
  },
  
  updateWithNotification: (matricule, id, data, expediteurEmail) => {
    return API.put(`/api/entretiens-mesures/${matricule}/${id}/with-notification`, data, {
      params: { expediteurEmail }
    });
  },
};

// ------------------ Entretien Positif Service ------------------
export const entretienPositifService = {

    getSansFaute: () => API.get("/api/entretiens-positifs/sans-faute"),
  envoyerAuSL: (payload) => API.post("/api/entretiens-positifs/envoyer-sl", payload),
  archiverEtCreer: (payload) => API.post("/api/entretiens-positifs/archiver", payload),
  exportPdf: () => API.get("/api/entretiens-positifs/export-pdf", { responseType: "blob" }),
  // Emails SL depuis la BD (nécessite auth SL)
  getSlEmails: () => API.get("/api/entretiens-positifs/public/emails"),
};

// ------------------ Notification Service ------------------
export const notificationService = {
  getAll: () => API.get("/api/notifications"),
  create: (data) => API.post("/api/notifications", data),
  delete: (id) => API.delete(`/api/notifications/${id}`),
  envoyerNotificationDirecte: (data) => API.post("/api/notifications/envoyer", data),
  getUnread: () => API.get("/api/notifications/unread"),
  countUnread: () => API.get("/api/notifications/count/unread"),
  markAsRead: (id) => API.post(`/api/notifications/${id}/read`),
  markAllAsRead: () => API.post("/api/notifications/mark-all-read"),
};

// ------------------ Archive Service ------------------
export const archiveService = {
  getAll: () => API.get("/api/archives"),
  getById: (id) => API.get(`/api/archives/${id}`),
  searchByMatricule: (matricule) => API.get("/api/archives/search", { params: { matricule } }),
  getByType: (type) => API.get(`/api/archives/type/${type}`),
  getByMatriculeExact: (matricule) => API.get(`/api/archives/matricule/${matricule}`),
};

// ------------------ Faute Service ------------------
export const fauteService = {
  getAll: () => API.get("/api/fautes"),
  search: (q) => API.get(`/api/fautes/search?q=${q}`),
  create: (data) => API.post("/api/fautes", data),
};



// ✅ Export par défaut - utilisez 'API' (majuscules)
export default API;