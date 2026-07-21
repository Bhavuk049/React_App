import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useAdminGetOrderQuery,
  useAdminUpdateOrderPaymentStatusMutation,
  useAdminUpdateOrderStatusMutation,
  useAdminUpdateOrderTrackingMutation,
} from "../../store/api/ordersApi.js";
import { ConfirmModal } from "../../components/ConfirmModal.jsx";
import { paymentMethodLabel } from "../../utils/paymentMethods.js";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const TRACKING_COMPANIES = [
  "Delhivery",
  "Blue Dart",
  "DTDC",
  "Ecom Express",
  "Xpressbees",
  "Shadowfax",
  "Ekart",
  "India Post",
  "FedEx",
  "DHL",
  "Amazon Shipping",
];
const OTHER_COMPANY = "__other__";

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order } = useAdminGetOrderQuery(id);
  const [updateOrderStatus] = useAdminUpdateOrderStatusMutation();
  const [updateOrderPaymentStatus] = useAdminUpdateOrderPaymentStatusMutation();
  const [updateOrderTracking] = useAdminUpdateOrderTrackingMutation();

  const [selectedStatus, setSelectedStatus] = useState("");
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingPaid, setPendingPaid] = useState(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [trackingCompanySelect, setTrackingCompanySelect] = useState("");
  const [trackingCompanyCustom, setTrackingCompanyCustom] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [trackingSaved, setTrackingSaved] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [loadedOrder, setLoadedOrder] = useState(null);

  if (order && order !== loadedOrder) {
    setLoadedOrder(order);
    setSelectedStatus(order.status);
    if (order.trackingCompany && !TRACKING_COMPANIES.includes(order.trackingCompany)) {
      setTrackingCompanySelect(OTHER_COMPANY);
      setTrackingCompanyCustom(order.trackingCompany);
    } else {
      setTrackingCompanySelect(order.trackingCompany ?? "");
      setTrackingCompanyCustom("");
    }
    setTrackingId(order.trackingId ?? "");
  }

  if (!order) {
    return <p className="text-sm text-neutral-500">Loading...</p>;
  }

  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);

  async function confirmStatusChange() {
    const newStatus = pendingStatus;
    setPendingStatus(null);
    setError("");
    setUpdating(true);
    try {
      await updateOrderStatus({ id: order.id, status: newStatus }).unwrap();
    } catch (err) {
      setError(err.data?.error ?? "Failed to update order status.");
      setSelectedStatus(order.status);
    } finally {
      setUpdating(false);
    }
  }

  async function confirmPaidChange() {
    const newIsPaid = pendingPaid;
    setPendingPaid(null);
    setError("");
    try {
      await updateOrderPaymentStatus({ id: order.id, isPaid: newIsPaid }).unwrap();
    } catch (err) {
      setError(err.data?.error ?? "Failed to update payment status.");
    }
  }

  async function handleTrackingSubmit(e) {
    e.preventDefault();
    setTrackingError("");
    setTrackingSaved(false);
    setTrackingSaving(true);
    try {
      const trackingCompany = trackingCompanySelect === OTHER_COMPANY ? trackingCompanyCustom : trackingCompanySelect;
      await updateOrderTracking({ id: order.id, payload: { trackingCompany, trackingId } }).unwrap();
      setTrackingSaved(true);
      setTimeout(() => setTrackingSaved(false), 2000);
    } catch (err) {
      setTrackingError(err.data?.error ?? "Failed to save tracking details.");
    } finally {
      setTrackingSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
          ← Back
        </button>
        <Link
          to={`/admin/orders/${order.id}/print`}
          target="_blank"
          rel="noopener"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Print / Download bill
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-neutral-900">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              order.channel === "POS" ? "bg-neutral-800 text-white" : "bg-sky-100 text-sky-700"
            }`}
          >
            {order.channel === "POS" ? "In-store (POS)" : "Online"}
          </span>
          {order.channel === "ONLINE" && order.deliveryMethod === "PICKUP" && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              Store pickup
            </span>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-600"}`}>
            {order.status}
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
      </p>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Order status</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => setPendingStatus(selectedStatus)}
            disabled={updating || selectedStatus === order.status}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {updating ? "Updating..." : "Update status"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Payment</h2>
        <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" checked={order.isPaid} onChange={(e) => setPendingPaid(e.target.checked)} />
          Payment received
          <span
            className={`ml-2 rounded-full px-3 py-1 text-xs font-medium ${
              order.isPaid ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {order.isPaid ? "Paid" : "Unpaid"}
          </span>
        </label>
        {order.paymentMethod === "COD" && !order.isPaid && (
          <p className="mt-2 text-xs text-neutral-500">
            Cash on delivery — tick this once you've collected payment from the customer.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Shipping &amp; tracking</h2>
        <form onSubmit={handleTrackingSubmit} className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Courier</label>
            <select
              value={trackingCompanySelect}
              onChange={(e) => setTrackingCompanySelect(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Select courier</option>
              {TRACKING_COMPANIES.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
              <option value={OTHER_COMPANY}>Other...</option>
            </select>
            {trackingCompanySelect === OTHER_COMPANY && (
              <input
                value={trackingCompanyCustom}
                onChange={(e) => setTrackingCompanyCustom(e.target.value)}
                placeholder="Courier name"
                className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Tracking ID</label>
            <input
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="e.g. DL123456789IN"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          {trackingError && <p className="text-sm text-red-600 sm:col-span-2">{trackingError}</p>}

          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={trackingSaving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
            >
              {trackingSaving ? "Saving..." : "Save tracking details"}
            </button>
            {trackingSaved && <span className="text-sm text-green-600">Saved.</span>}
          </div>
        </form>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Customer</h2>
          {order.user ? (
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="font-medium text-neutral-700">Name:</dt>
                <dd className="text-neutral-600">
                  <Link to={`/admin/users/${order.user.id}`} className="hover:underline">
                    {[order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email}
                  </Link>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-neutral-700">Email:</dt>
                <dd className="text-neutral-600">{order.user.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-neutral-700">Phone:</dt>
                <dd className="text-neutral-600">{order.user.phone ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="font-medium text-neutral-700">Name:</dt>
                <dd className="text-neutral-600">{order.guestName || "Walk-in customer"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium text-neutral-700">Phone:</dt>
                <dd className="text-neutral-600">{order.guestPhone ?? "—"}</dd>
              </div>
              <p className="text-xs text-neutral-400">No account — in-store sale.</p>
            </dl>
          )}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">
            {order.deliveryMethod === "PICKUP" ? "Pickup from store" : "Delivery address"}
          </h2>
          {order.deliveryMethod === "PICKUP" ? (
            <p className="mt-3 text-sm text-neutral-600">Contact phone: {order.contactPhone}</p>
          ) : order.address ? (
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
          ) : (
            <p className="mt-3 text-sm text-neutral-500">No delivery address — in-store sale.</p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Items ({totalUnits} unit{totalUnits === 1 ? "" : "s"})</h2>
        <table className="mt-4 min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="text-left text-neutral-500">
            <tr>
              <th className="py-2 font-medium">Product</th>
              <th className="py-2 font-medium">Price</th>
              <th className="py-2 font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 text-neutral-900">{item.name}</td>
                <td className="py-3 text-neutral-500">{currency.format(item.price)}</td>
                <td className="py-3 text-neutral-500">{item.quantity}</td>
                <td className="py-3 text-right font-medium text-neutral-900">
                  {currency.format(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
        </div>
      </section>

      <ConfirmModal
        open={pendingStatus !== null}
        title={`Change status to ${pendingStatus}?`}
        message={
          pendingStatus === "CANCELLED"
            ? "The ordered quantity will be added back to stock."
            : order.status === "CANCELLED" && pendingStatus !== "CANCELLED"
              ? "This order's stock will be deducted again — it'll fail if there isn't enough left."
              : undefined
        }
        confirmLabel="Update"
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatus(null)}
      />

      <ConfirmModal
        open={pendingPaid !== null}
        title={pendingPaid ? "Mark this order as paid?" : "Mark this order as unpaid?"}
        confirmLabel={pendingPaid ? "Mark paid" : "Mark unpaid"}
        onConfirm={confirmPaidChange}
        onCancel={() => setPendingPaid(null)}
      />
    </div>
  );
}
