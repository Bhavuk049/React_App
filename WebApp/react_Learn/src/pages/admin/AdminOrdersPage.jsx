import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminListOrdersQuery } from "../../store/api/ordersApi.js";
import { paymentMethodLabel } from "../../utils/paymentMethods.js";
import { DATE_RANGE_PRESETS, getPresetDateRange } from "../../utils/dateRanges.js";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const PAGE_SIZE_OPTIONS = ["10", "20", "50", "all"];

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const DEFAULT_RANGE = getPresetDateRange("today");

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("20");
  const [datePreset, setDatePreset] = useState("today");
  const [startDate, setStartDate] = useState(DEFAULT_RANGE.startDate);
  const [endDate, setEndDate] = useState(DEFAULT_RANGE.endDate);

  const { data, isFetching: loading } = useAdminListOrdersQuery({
    page,
    pageSize,
    channel: "ONLINE",
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  });
  const orders = data?.orders ?? [];
  const pagination = data?.pagination ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 };
  const totalAmount = data?.totalAmount ?? 0;

  function handlePageSizeChange(value) {
    setPageSize(value);
    setPage(1);
  }

  function handleDateChange(setter, value) {
    setter(value);
    setPage(1);
  }

  function handlePresetChange(value) {
    setDatePreset(value);
    setPage(1);
    if (value === "custom") return;
    const range = getPresetDateRange(value);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Orders</h1>
      <p className="mt-1 text-sm text-neutral-500">Online orders only — see Sales for online + in-store together.</p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Date range</label>
          <select
            value={datePreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {DATE_RANGE_PRESETS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {datePreset === "custom" && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange(setStartDate, e.target.value)}
                className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange(setEndDate, e.target.value)}
                className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        <div className="ml-auto">
          <label className="block text-sm font-medium text-neutral-700">Per page</label>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(e.target.value)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "all" ? "All" : opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-500">
          Total for {DATE_RANGE_PRESETS.find((opt) => opt.value === datePreset)?.label ?? "selected range"}
        </p>
        <p className="mt-1 text-2xl font-semibold text-neutral-900">{currency.format(totalAmount)}</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-neutral-500">
                  No orders found.
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
                    <Link to={`/admin/users/${order.userId}`} className="hover:text-neutral-900 hover:underline">
                      {[order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email}
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
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
          <p>
            Page {pagination.page} of {pagination.totalPages} — {pagination.total} orders
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
