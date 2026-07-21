import { Routes, Route } from "react-router-dom";
import { StorefrontLayout } from "./layouts/StorefrontLayout.jsx";
import { AdminLayout } from "./layouts/AdminLayout.jsx";
import { AdminRoute } from "./routes/AdminRoute.jsx";
import { Home } from "./pages/Home.jsx";
import { ProductsPage } from "./pages/ProductsPage.jsx";
import { ProductDetailPage } from "./pages/ProductDetailPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { AdminDashboard } from "./pages/admin/AdminDashboard.jsx";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage.jsx";
import { AdminCategoriesPage } from "./pages/admin/AdminCategoriesPage.jsx";

function App() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
