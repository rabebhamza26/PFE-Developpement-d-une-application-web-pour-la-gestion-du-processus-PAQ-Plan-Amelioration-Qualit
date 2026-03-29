// services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

export const dashboardService = {
  getStats: () => API.get("/dashboard/stats"),
  getSegmentStats: () => API.get("/dashboard/segment-stats"),
  getPerformanceHistory: () => API.get("/dashboard/performance-history"),
  exportReport: (format) => API.get(`/dashboard/export/${format}`, { responseType: "blob" }),
};



export const userService = {
  getAllUsers: () => API.get("/users"),
  getUserById: (id) => API.get(`/users/${id}`),
  createUser: (data) => API.post("/users", data),
  updateUser: (id, data) => API.put(`/users/${id}`, data),
  deleteUser: (id) => API.delete(`/users/${id}`),

  // ✅ Activer / désactiver
  toggleActive: (id) => API.patch(`/users/${id}/toggle-active`),
};

export const getSegments = () => API.get("/segments");
export const createSegment = (segment) => API.post("/segments", segment);
export const updateSegment = (id, segment) => API.put(`/segments/${id}`, segment);
export const deleteSegment = (id) => API.delete(`/segments/${id}`);

// ------------------ entretienPositifService ------------------
export const entretienPositifService = {
  getSansFaute: async () => {
    try {
      const response = await API.get("/entretiens-positifs/sans-faute");
      return response;
    } catch (err) {
      console.error("Erreur getSansFaute:", err);
      throw err;
    }
  },
  
  envoyerAuSL: async (payload) => {
    try {
      const response = await API.post("/entretiens-positifs/envoyer-sl", payload);
      return response;
    } catch (err) {
      console.error("Erreur envoyerAuSL:", err);
      throw err;
    }
  },
  
  archiverEtCreer: async (payload) => {
    try {
      const response = await API.post("/entretiens-positifs/archiver-et-creer", payload);
      return response;
    } catch (err) {
      console.error("Erreur archiverEtCreer:", err);
      throw err;
    }
  }
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

export const paqService = {
  getByMatricule: (matricule) => API.get(`/paq/${matricule}`),
  getAllByMatricule: (matricule) => API.get(`/paq/history/${matricule}`), // Changed from /paq/history/${matricule}
  getAll: () => API.get("/paq/all"),
  getHistory: (matricule, fromDate) =>
    API.get(`/paq/${matricule}/history`, { params: { fromDate } }),
  create: (matricule) => API.post(`/paq/create/${matricule}`),
  createPremierEntretien: (matricule, data) =>
    API.post(`/paq/${matricule}/premier-entretien`, data),
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



export default API;
