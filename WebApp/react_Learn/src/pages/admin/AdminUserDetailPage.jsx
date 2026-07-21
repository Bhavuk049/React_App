import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminGetUserQuery } from "../../store/api/usersApi.js";
import { paymentMethodLabel } from "../../utils/paymentMethods.js";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useAdminGetUserQuery(id);

  if (!data) {
    return <p className="text-sm text-neutral-500">Loading...</p>;
  }

  const { user, orders } = data;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
        ← Back
      </button>

      <h1 className="mt-4 text-xl font-semibold text-neutral-900">
        {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Profile</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Email:</dt>
              <dd className="text-neutral-600">{user.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Phone:</dt>
              <dd className="text-neutral-600">{user.phone ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Role:</dt>
              <dd className="text-neutral-600">{user.role}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Verified:</dt>
              <dd className="text-neutral-600">{user.emailVerifiedAt ? "Yes" : "No"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Joined:</dt>
              <dd className="text-neutral-600">{new Date(user.createdAt).toLocaleDateString("en-IN")}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Addresses</h2>
          {user.addresses.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">No addresses saved.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {user.addresses.map((address) => (
                <div key={address.id} className="text-sm text-neutral-600">
                  {address.label && <p className="font-medium text-neutral-900">{address.label}</p>}
                  <p>
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                  </p>
                  <p>
                    {address.city}, {address.state} {address.postalCode}, India
                  </p>
                  <p>{address.phone}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white">
        <h2 className="border-b border-neutral-200 p-6 pb-4 text-base font-semibold text-neutral-900">Orders</h2>
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    <Link to={`/admin/orders/${order.id}`} className="hover:underline">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{currency.format(order.total)}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {paymentMethodLabel(order.paymentMethod)}{" "}
                    <span className={order.isPaid ? "text-green-600" : "text-neutral-400"}>
                      ({order.isPaid ? "Paid" : "Unpaid"})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
