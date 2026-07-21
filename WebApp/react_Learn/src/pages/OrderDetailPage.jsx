import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetMyOrderQuery } from "../store/api/ordersApi.js";
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

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isError } = useGetMyOrderQuery(id);

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <p className="text-neutral-500">Order not found.</p>
        <Link to="/orders" className="mt-4 inline-block text-sm font-medium text-neutral-900 underline">
          Back to my orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">Loading...</div>;
  }

  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
          ← Back
        </button>
        <Link
          to={`/orders/${order.id}/print`}
          target="_blank"
          rel="noopener"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Print / Download bill
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-neutral-900">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-600"}`}>
          {order.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
      </p>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">
          Items ({totalUnits} unit{totalUnits === 1 ? "" : "s"})
        </h2>
        <ul className="mt-3 divide-y divide-neutral-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3 text-sm">
              <span className="text-neutral-700">
                {item.name} <span className="text-neutral-400">× {item.quantity}</span>
              </span>
              <span className="font-medium text-neutral-900">{currency.format(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>{currency.format(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Shipping</span>
            <span>{Number(order.shippingFee) === 0 ? "Free" : currency.format(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-neutral-900">
            <span>Total</span>
            <span>{currency.format(order.total)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Payment method</span>
            <span className="font-medium text-neutral-700">{paymentMethodLabel(order.paymentMethod)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Payment status</span>
            <span className={`font-medium ${order.isPaid ? "text-green-600" : "text-amber-600"}`}>
              {order.isPaid ? "Paid" : "Unpaid"}
            </span>
          </div>
        </div>
      </section>

      {order.trackingId && (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Tracking</h2>
          <div className="mt-3 text-sm text-neutral-600">
            {order.trackingCompany && <p className="font-medium text-neutral-900">{order.trackingCompany}</p>}
            <p>Tracking ID: {order.trackingId}</p>
          </div>
        </section>
      )}

      {order.deliveryMethod === "PICKUP" ? (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Pickup from store</h2>
          <p className="mt-3 text-sm text-neutral-600">Contact phone: {order.contactPhone}</p>
        </section>
      ) : order.address ? (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Delivery address</h2>
          <div className="mt-3 text-sm text-neutral-600">
            {order.address.label && <p className="font-medium text-neutral-900">{order.address.label}</p>}
            <p>
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}
            </p>
            <p>
              {order.address.city}, {order.address.state} {order.address.postalCode}, India
            </p>
            <p>{order.address.phone}</p>
          </div>
        </section>
      ) : (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm text-neutral-500">In-store purchase — no delivery address.</p>
        </section>
      )}
    </div>
  );
}
