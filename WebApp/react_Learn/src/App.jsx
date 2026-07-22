import { Routes, Route } from "react-router-dom";
import { StorefrontLayout } from "./layouts/StorefrontLayout.jsx";
import { AdminLayout } from "./layouts/AdminLayout.jsx";
import { AdminRoute } from "./routes/AdminRoute.jsx";
import { RequireAuth } from "./routes/RequireAuth.jsx";
import { Home } from "./pages/Home.jsx";
import { ProductsPage } from "./pages/ProductsPage.jsx";
import { ProductDetailPage } from "./pages/ProductDetailPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { AccountPage } from "./pages/AccountPage.jsx";
import { OrdersPage } from "./pages/OrdersPage.jsx";
import { OrderDetailPage } from "./pages/OrderDetailPage.jsx";
import { OrderInvoicePage } from "./pages/OrderInvoicePage.jsx";
import { LegalPagePage } from "./pages/LegalPagePage.jsx";
import { AdminDashboard } from "./pages/admin/AdminDashboard.jsx";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage.jsx";
import { AdminProductDetailPage } from "./pages/admin/AdminProductDetailPage.jsx";
import { AdminCategoriesPage } from "./pages/admin/AdminCategoriesPage.jsx";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage.jsx";
import { AdminUserDetailPage } from "./pages/admin/AdminUserDetailPage.jsx";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage.jsx";
import { AdminOrderDetailPage } from "./pages/admin/AdminOrderDetailPage.jsx";
import { AdminOrderInvoicePage } from "./pages/admin/AdminOrderInvoicePage.jsx";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage.jsx";
import { AdminPosPage } from "./pages/admin/AdminPosPage.jsx";
import { AdminSalesPage } from "./pages/admin/AdminSalesPage.jsx";

function App() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/privacy-policy" element={<LegalPagePage slug="privacy-policy" />} />
        <Route path="/legal-notice" element={<LegalPagePage slug="legal-notice" />} />
        <Route path="/shipping-policy" element={<LegalPagePage slug="shipping-policy" />} />
        <Route path="/terms-of-service" element={<LegalPagePage slug="terms-of-service" />} />
        <Route path="/refund-policy" element={<LegalPagePage slug="refund-policy" />} />
        <Route element={<RequireAuth />}>
          <Route path="/account" element={<AccountPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>
      </Route>

      {/* Layout-free print views — no header/nav/footer chrome, just the invoice. */}
      <Route element={<RequireAuth />}>
        <Route path="/orders/:id/print" element={<OrderInvoicePage />} />
      </Route>

      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/:id" element={<AdminProductDetailPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="sales" element={<AdminSalesPage />} />
          <Route path="pos" element={<AdminPosPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        <Route path="orders/:id/print" element={<AdminOrderInvoicePage />} />
      </Route>
    </Routes>
  );
}

export default App;
