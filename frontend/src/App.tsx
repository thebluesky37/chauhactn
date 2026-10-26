import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getToken } from "./lib/auth";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ProjectPage from "./pages/ProjectPage";
import Login from "./pages/Login";
import AdminProjects from "./pages/AdminProjects";
import Download from "./pages/Download";
import ScopeCatalog from "./pages/ScopeCatalog";
import ProjectEdit from "./pages/ProjectEdit";

function RequireAdmin({ children }: { children: JSX.Element }) {
  const loc = useLocation();
  return getToken() ? children : <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<RequireAdmin><AdminProjects /></RequireAdmin>} />
        <Route path="/admin/projects/:id" element={<RequireAdmin><ProjectPage admin /></RequireAdmin>} />
        <Route path="/admin/projects/:id/edit" element={<RequireAdmin><ProjectEdit /></RequireAdmin>} />
        <Route path="/admin/scopes" element={<RequireAdmin><ScopeCatalog /></RequireAdmin>} />
        <Route path="/download" element={<RequireAdmin><Download /></RequireAdmin>} />
        <Route path="*" element={<p className="py-20 text-center text-slate-500">Không tìm thấy trang.</p>} />
      </Route>
    </Routes>
  );
}
