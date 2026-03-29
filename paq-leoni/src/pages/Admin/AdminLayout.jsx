import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <nav className="col-md-2 d-md-block bg-dark sidebar collapse vh-100">
          <div className="position-sticky pt-3">
            <h5 className="text-white text-center mb-4">Admin Panel</h5>
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    "nav-link text-white " + (isActive ? "bg-primary" : "")
                  }
                >
                  <i className="fas fa-tachometer-alt me-2"></i>
                  Tableau de bord
                </NavLink>
              </li>
              <li className="nav-item mb-2">
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    "nav-link text-white " + (isActive ? "bg-primary" : "")
                  }
                >
                  <i className="fas fa-users me-2"></i>
                  Gestion des utilisateurs
                </NavLink>
              </li>
              <li className="nav-item mb-2">
                <NavLink
                  to="/admin/segments"
                  className={({ isActive }) =>
                    "nav-link text-white " + (isActive ? "bg-primary" : "")
                  }
                >
                  <i className="fas fa-layer-group me-2"></i>
                  Gestion des segments
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="col-md-10 ms-sm-auto px-md-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}