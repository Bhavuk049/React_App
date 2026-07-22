import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Icon } from "../components/Icon.jsx";
import { ICON_PATHS } from "../utils/iconPaths.js";

const NAV_ITEMS = [
  { to: "/admin", end: true, label: "Dashboard", icon: ICON_PATHS.dashboard },
  { to: "/admin/pos", label: "POS", icon: ICON_PATHS.pos },
  { to: "/admin/products", label: "Products", icon: ICON_PATHS.products },
  { to: "/admin/categories", label: "Categories", icon: ICON_PATHS.categories },
  { to: "/admin/users", label: "Users", icon: ICON_PATHS.users },
  { to: "/admin/sales", label: "Sales", icon: ICON_PATHS.sales },
  { to: "/admin/orders", label: "Orders", icon: ICON_PATHS.orders },
  { to: "/admin/settings", label: "Settings", icon: ICON_PATHS.settings },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
      : "text-neutral-600 hover:bg-indigo-50 hover:text-indigo-700"
  }`;

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <aside className="w-56 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white p-4">
        <div className="mb-6 px-3">
          <div className="flex items-center gap-2">
            <img src="/logo.webp" alt="" className="h-14 w-auto" />
            <span className="text-lg font-semibold tracking-tight text-neutral-900">TheUniqPick</span>
          </div>
          <span className="mt-2 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Admin
          </span>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ to, end, label, icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon path={icon} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
          <p className="text-sm text-neutral-500">Signed in as {user?.firstName ?? user?.email}</p>
          <button
            onClick={logout}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-red-50 hover:text-red-600"
          >
            Logout
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
