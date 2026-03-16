// services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8081/api",
});

const API_URL = "http://localhost:8081/api/users";
const API_URLL = "http://localhost:8081/api/segments";


export const dashboardService = {
  getStats: () => API.get("/dashboard/stats"),
};

export const paqService = {
  getAll: () => API.get("/paqs"),
};

export const userService = {
  getAllUsers() {
    return API.get("/users");
  },

  getUserById(id) {
    return API.get(`/users/${id}`);
  },

  createUser(user) {
    return API.post("/users", user);
  },

  updateUser(id, user) {
    return API.put(`/users/${id}`, user);
  },

  deleteUser(id) {
    return API.delete(`/users/${id}`);
  }
};




export const getSegments = () => axios.get(API_URLL);
export const createSegment = (segment) => axios.post(API_URLL, segment);
export const updateSegment = (id, segment) => axios.put(`${API_URLL}/${id}`, segment);
export const deleteSegment = (id) => axios.delete(`${API_URLL}/${id}`);

export default API;
