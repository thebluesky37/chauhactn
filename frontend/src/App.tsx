import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Building2, LogOut } from "lucide-react";
import { getToken, logout } from "./lib/auth";
import Home from "./pages/Home";
import ProjectPage from "./pages/ProjectPage";
import Login from "./pages/Login";
import AdminProjects from "./pages/AdminProjects";
import Download from "./pages/Download";
import ScopeCatalog from "./pages/ScopeCatalog";
import ProjectEdit from "./pages/ProjectEdit";

function Layout() {
  const nav = useNavigate();
  const admin = !!getToken();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-brand-700 dark:text-brand-100">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
              <Building2 size={20} />
            </span>
            Quản lý Dự án
          </Link>
          <nav className="flex items-center gap-2">
            {admin ? (
              <>
                <Link to="/admin" className="btn-ghost">Quản trị</Link>
                <Link to="/admin/scopes" className="btn-ghost">Danh mục scope</Link>
                <button
                  className="btn-ghost"
                  aria-label="Đăng xuất"
                  onClick={() => {
                    logout();
                    nav("/");
                  }}
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-ghost">Đăng nhập Admin</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800">
        © {new Date().getFullYear()} Quản lý Dự án
      </footer>
    </div>
  );
}

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
