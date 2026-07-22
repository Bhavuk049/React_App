import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useCart } from "../hooks/useCart.js";

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-rose-600" : "text-neutral-500 hover:text-rose-600"
  }`;

export function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-rose-200 bg-gradient-to-r from-rose-200 via-pink-100 to-rose-200 shadow-sm shadow-rose-200/40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.webp" alt="" className="h-16 w-auto" />
          <span className="font-display text-xl font-semibold tracking-tight text-neutral-900">TheUniqPick</span>
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
          <Link to="/cart" className="relative text-sm font-medium text-neutral-600 hover:text-rose-600">
            Cart
            {totalItems > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              {user.role === "ADMIN" && (
                <Link to="/admin" className="text-sm font-medium text-neutral-600 hover:text-rose-600">
                  Admin
                </Link>
              )}
              {user.role === "CUSTOMER" && (
                <Link to="/orders" className="text-sm font-medium text-neutral-600 hover:text-rose-600">
                  Orders
                </Link>
              )}
              {user.role === "CUSTOMER" && (
                <Link
                  to="/account"
                  title="My account"
                  aria-label="My account"
                  className="inline-flex rounded-full p-1 text-neutral-600 hover:bg-rose-50 hover:text-rose-600"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 8a7 7 0 1 1 14 0 1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              )}
              <button onClick={logout} className="text-sm font-medium text-neutral-600 hover:text-rose-600">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm font-medium text-neutral-600 hover:text-rose-600">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
