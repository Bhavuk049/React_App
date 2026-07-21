import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGetMyOrderQuery } from "../store/api/ordersApi.js";
import { useGetSettingsQuery } from "../store/api/settingsApi.js";
import { useAuth } from "../hooks/useAuth.js";
import { InvoiceDocument } from "../components/InvoiceDocument.jsx";

export function OrderInvoicePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: order } = useGetMyOrderQuery(id);
  const { data: settings } = useGetSettingsQuery();

  useEffect(() => {
    if (order) {
      document.title = `Invoice-${order.id.slice(0, 8).toUpperCase()}`;
    }
  }, [order]);

  if (!order || !settings) {
    return <p className="p-8 text-sm text-neutral-500">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl px-4 pb-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Print / Save as PDF
        </button>
      </div>
      <InvoiceDocument
        order={order}
        settings={settings}
        customer={{
          name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email,
          email: user?.email,
          phone: user?.phone,
        }}
      />
    </div>
  );
}
