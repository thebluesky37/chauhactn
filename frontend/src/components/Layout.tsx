import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Building2, FolderKanban, Home, ListChecks, LogIn, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { getToken, logout } from "../lib/auth";

interface Item {
  to?: string;
  label: string;
  icon: LucideIcon;
  active?: (path: string) => boolean;
  onClick?: () => void;
}

const WIDE = "(min-width: 1024px)";

function loadOpen(): boolean {
  try {
    return localStorage.getItem("sidebar-open") !== "0";
  } catch {
    return true;
  }
}

// Bố cục kiểu YouTube: thanh trên có nút hamburger, menu trái (rộng/thu nhỏ ở desktop, ngăn kéo ở điện thoại).
export default function Layout() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const admin = !!getToken();
  const [wideOpen, setWideOpen] = useState(loadOpen); // desktop: rộng hay thu nhỏ
  const [drawer, setDrawer] = useState(false); // điện thoại: ngăn kéo

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  function toggle() {
    if (window.matchMedia(WIDE).matches) {
      setWideOpen((v) => {
        try { localStorage.setItem("sidebar-open", v ? "0" : "1"); } catch { /* bỏ qua */ }
        return !v;
      });
    } else {
      setDrawer((v) => !v);
    }
  }

  const items: Item[] = [
    { to: "/", label: "Trang chủ", icon: Home, active: (p) => p === "/" || p.startsWith("/projects/") },
    ...(admin
      ? [
          { to: "/admin", label: "Quản lý dự án", icon: FolderKanban, active: (p: string) => p.startsWith("/admin") && !p.startsWith("/admin/scopes") },
          { to: "/admin/scopes", label: "Danh mục scope", icon: ListChecks },
          { label: "Đăng xuất", icon: LogOut, onClick: () => { logout(); nav("/"); } },
        ]
      : [{ to: "/login", label: "Đăng nhập Admin", icon: LogIn }]),
  ];

  const menu = (mini: boolean) => (
    <ul className="space-y-1 p-2">
      {items.map((it) => {
        const on = it.to ? (it.active ? it.active(pathname) : pathname === it.to) : false;
        const cls = mini
          ? "flex flex-col items-center gap-1 rounded-lg px-1 py-3 text-[10px]"
          : "flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm";
        const color = on ? "bg-slate-100 font-semibold dark:bg-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-800";
        const inner = (
          <>
            <it.icon size={mini ? 20 : 22} className={on ? "text-brand-600" : ""} />
            <span className={mini ? "text-center leading-tight" : ""}>{it.label}</span>
          </>
        );
        return (
          <li key={it.label}>
            {it.to ? (
              <Link to={it.to} className={`${cls} ${color}`} aria-current={on ? "page" : undefined}>{inner}</Link>
            ) : (
              <button type="button" onClick={it.onClick} className={`${cls} ${color} w-full text-left`}>{inner}</button>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <button type="button" className="btn-ghost !px-2" onClick={toggle} aria-label="Mở hoặc đóng menu">
          <Menu size={22} />
        </button>
        <Link to="/" className="flex items-center gap-2 font-bold text-brand-700 dark:text-brand-100">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <Building2 size={18} />
          </span>
          <span className="hidden sm:inline">Quản lý Dự án</span>
        </Link>
        <div className="ml-auto">
          {admin ? (
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-slate-800 dark:text-brand-100">Admin</span>
          ) : (
            <Link to="/login" className="btn-ghost">Đăng nhập</Link>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop: menu cố định bên trái, rộng hoặc thu nhỏ */}
        <aside
          className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 overflow-y-auto border-r border-slate-200 bg-white transition-[width] dark:border-slate-800 dark:bg-slate-900 lg:block ${
            wideOpen ? "w-60" : "w-[76px]"
          }`}
          aria-label="Menu"
        >
          {menu(!wideOpen)}
        </aside>

        {/* Điện thoại: ngăn kéo phủ lên nội dung */}
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} aria-hidden />
            <aside className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-white shadow-xl dark:bg-slate-900" aria-label="Menu">
              <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
                <button type="button" className="btn-ghost !px-2" onClick={() => setDrawer(false)} aria-label="Đóng menu">
                  <X size={22} />
                </button>
                <span className="font-bold text-brand-700 dark:text-brand-100">Quản lý Dự án</span>
              </div>
              {menu(false)}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
