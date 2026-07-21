import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
  }`;

export function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-semibold tracking-tight text-neutral-900">
          UniqPick
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/products" className={navLinkClass}>
            Shop
          </NavLink>
        </nav>

        <div className="flex items-center gap-5">
          <Link
            to="/cart"
            className="relative text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Cart
            {totalItems > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "ADMIN" && (
                <Link to="/admin" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
