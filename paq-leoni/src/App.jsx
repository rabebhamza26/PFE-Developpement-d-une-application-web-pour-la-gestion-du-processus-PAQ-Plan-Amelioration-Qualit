import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import SiteSelection from "./pages/SiteSelection";
import PlantSelection from "./pages/PlantSelection";
import Login from "./pages/Login";
import AdminDashboard from "./pages/adminDashboard";
import Dashboard from "./pages/Dashboard";
import AddUser from "./pages/AddUser";
import EditUser from "./pages/EditUser";
import AdminLayout from "./pages/AdminLayout";
import UsersManagement from "./pages/UsersManagement";
import SegmentManagement from "./pages/SegmentManagement";
import CollaboratorManagement from "./pages/CollaboratorManagement";
import AddCollaborator from "./pages/AddCollaborator";
import EditCollaborator from "./pages/EditCollaborator";
import PaqDossier from "./pages/PaqDossier";
import CreateEntretien from "./pages/CreateEntretien";
import PaqDossierIndex from "./pages/PaqDossierIndex";


function App() {
  return (
    <Router>
      <Routes>
        {/* public (no layout) */}
        <Route path="/" element={<SiteSelection />} />
        <Route path="/plants/:siteId" element={<PlantSelection />} />
        <Route path="/login" element={<Login />} />

        {/* app layout */}
        <Route path="/" element={<AppLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="collaborateurs" element={<CollaboratorManagement />} />
          <Route path="CollaboratorManagement" element={<CollaboratorManagement />} />
          <Route path="add-collaborator" element={<AddCollaborator />} />
          <Route path="edit-collaborator/:matricule" element={<EditCollaborator />} />
          <Route path="paq-dossier" element={<PaqDossierIndex />} />
          <Route path="paq-dossier/:matricule" element={<PaqDossier />} />
          <Route path="create-entretien/:matricule" element={<CreateEntretien />} />
        </Route>

        {/* admin area: users/segments only visible here */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="segments" element={<SegmentManagement />} />
          <Route path="add-user" element={<AddUser />} />
          <Route path="edit-user/:id" element={<EditUser />} />
        </Route>

        <Route path="*" element={<SiteSelection />} />
      </Routes>
    </Router>
  );
}

export default App
