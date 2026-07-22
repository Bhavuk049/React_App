import { Outlet } from "react-router-dom";
import { Header } from "../components/Header.jsx";
import { Footer } from "../components/Footer.jsx";
import { PromoBar } from "../components/PromoBar.jsx";

export function StorefrontLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
