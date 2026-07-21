import { Link } from "react-router-dom";
import { useListMyOrdersQuery } from "../store/api/ordersApi.js";
import { paymentMethodLabel } from "../utils/paymentMethods.js";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function OrdersPage() {
  const { data: orders } = useListMyOrdersQuery();

  if (!orders) {
    return <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">Loading...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-neutral-500">You haven't placed any orders yet.</p>
        <Link to="/products" className="mt-4 inline-block text-sm font-medium text-neutral-900 underline">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-neutral-900">My orders</h1>

      <div className="mt-8 space-y-4">
        {orders.map((order) => {
          const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block rounded-lg border border-neutral-200 bg-white p-6 hover:border-neutral-400"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-neutral-900">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-neutral-500">
                    {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                  {order.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3 text-sm">
                <p className="text-neutral-500">
                  {totalUnits} unit{totalUnits === 1 ? "" : "s"} · {paymentMethodLabel(order.paymentMethod)} ·{" "}
                  <span className={order.isPaid ? "text-green-600" : "text-amber-600"}>
                    {order.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </p>
                <p className="text-base font-semibold text-neutral-900">{currency.format(order.total)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
