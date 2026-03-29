import './App.css'
import { Routes, Route } from "react-router-dom";

import AppLayout from "./components/AppLayout";
import SiteSelection from "./pages/SiteSelection";
import PlantSelection from "./pages/PlantSelection";
import Login from "./pages/Login";
import AdminDashboard from "./pages/Admin/adminDashboard";
import Dashboard from "./pages/Dashboard";
import AddUser from "./pages/Admin/AddUser";
import EditUser from "./pages/Admin/EditUser";
import AdminLayout from "./pages/Admin/AdminLayout";
import UsersManagement from "./pages/Admin/UsersManagement";
import SegmentManagement from "./pages/Admin/SegmentManagement";
import CollaboratorManagement from "./pages/SL/CollaboratorManagement";
import AddCollaborator from "./pages/SL/AddCollaborator";
import EditCollaborator from "./pages/SL/EditCollaborator";
import PaqDossier from "./pages/SL/PaqDossier";
import EntretienExplicatif from "./pages/SL/EntretienExplicatif";
import EntretienDaccord from "./pages/SL/EntretienDaccord";
import EntretienDeMesure from "./pages/SL/EntretienDeMesure";
import EntretienDeDecision from "./pages/SL/EntretienDeDecision";
import EntretienFinal from "./pages/SL/EntretienFinal";
import PaqDossierIndex from "./pages/SL/PaqDossierIndex";
import EntretienPositif from "./pages/SL/EntretienPositif";

function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/" element={<SiteSelection />} />
      <Route path="/plants/:siteId" element={<PlantSelection />} />
      <Route path="/login" element={<Login />} />

      {/* app layout */}
      <Route path="/" element={<AppLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="collaborateurs" element={<CollaboratorManagement />} />
        <Route path="add-collaborator" element={<AddCollaborator />} />
        <Route path="edit-collaborator/:matricule" element={<EditCollaborator />} />
        <Route path="paq-dossier" element={<PaqDossierIndex />} />
        <Route path="paq-dossier/:matricule" element={<PaqDossier />} />
        <Route path="entretien-positif" element={<EntretienPositif />} />

        <Route path="entretien-explicatif/:matricule" element={<EntretienExplicatif niveau={1} />} />
        <Route path="entretien-daccord/:matricule" element={<EntretienDaccord niveau={2} />} />
        <Route path="entretien-de-mesure/:matricule" element={<EntretienDeMesure niveau={3} />} />
        <Route path="entretien-de-decision/:matricule" element={<EntretienDeDecision niveau={4} />} />
        <Route path="entretien-final/:matricule" element={<EntretienFinal niveau={5} />} />
      </Route>

      {/* admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="segments" element={<SegmentManagement />} />
        <Route path="add-user" element={<AddUser />} />
        <Route path="edit-user/:id" element={<EditUser />} />
      </Route>

      <Route path="*" element={<SiteSelection />} />
    </Routes>
  );
}

export default App;