import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const linkClass = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
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
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Admin</p>
        </div>
        <nav className="space-y-1">
          <NavLink to="/admin" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/products" className={linkClass}>
            Products
          </NavLink>
          <NavLink to="/admin/categories" className={linkClass}>
            Categories
          </NavLink>
          <NavLink to="/admin/users" className={linkClass}>
            Users
          </NavLink>
          <NavLink to="/admin/pos" className={linkClass}>
            POS
          </NavLink>
          <NavLink to="/admin/sales" className={linkClass}>
            Sales
          </NavLink>
          <NavLink to="/admin/orders" className={linkClass}>
            Orders
          </NavLink>
          <NavLink to="/admin/settings" className={linkClass}>
            Settings
          </NavLink>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
          <p className="text-sm text-neutral-500">Signed in as {user?.firstName ?? user?.email}</p>
          <button onClick={logout} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
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
