import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { userService } from "../services/api";

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUsers();
  }, [location.key]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await userService.getAllUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError("Erreur lors du chargement des utilisateurs: " + (err.response?.data?.message || err.message));
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm("Etes-vous sur de vouloir supprimer cet utilisateur ?")) {
      try {
        await userService.deleteUser(id);
        loadUsers();
      } catch (err) {
        setError("Erreur lors de la suppression: " + (err.response?.data?.message || err.message));
        console.error("Erreur:", err);
      }
    }
  };

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary mb-0">
          <i className="fas fa-users me-2"></i>
          Gestion des utilisateurs
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/admin/add-user")}
        >
          <i className="fas fa-user-plus me-2"></i>
          Ajouter
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted mb-0">Aucun utilisateur trouve</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom complet</th>
                <th>Login</th>
                <th>Mot de passe</th>
                <th>Role</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.nomUtilisateur}</td>
                  <td>{user.login}</td>
                  <td>********</td>
                  <td>
                    <span className={`badge ${
                      user.role === 'ADMIN' ? 'bg-danger' :
                      user.role === 'RH' ? 'bg-primary' :
                      user.role === 'SGL' ? 'bg-success' : 'bg-warning'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="btn-group" role="group">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/admin/edit-user/${user.id}`)}
                        title="Modifier"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteUser(user.id)}
                        title="Supprimer"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
