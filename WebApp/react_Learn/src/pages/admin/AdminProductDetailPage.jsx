import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminGetProductQuery } from "../../store/api/productsApi.js";
import { resolveImageUrl } from "../../utils/images.js";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function AdminProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useAdminGetProductQuery(id);

  if (!data) {
    return <p className="text-sm text-neutral-500">Loading...</p>;
  }

  const { product, productLogs } = data;
  const netChange = productLogs.reduce((sum, entry) => sum + entry.delta, 0);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
        ← Back
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-neutral-900">{product.name}</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            product.isActive ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {product.isActive ? "Published" : "Unpublished"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Details</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Slug:</dt>
              <dd className="text-neutral-600">{product.slug}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Category:</dt>
              <dd className="text-neutral-600">{product.category?.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Sale price:</dt>
              <dd className="text-neutral-600">{currency.format(product.price)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Purchase price:</dt>
              <dd className="text-neutral-600">
                {product.purchasePrice ? currency.format(product.purchasePrice) : "—"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Current stock:</dt>
              <dd className={product.stock === 0 ? "font-medium text-red-600" : "text-neutral-600"}>
                {product.stock}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Featured:</dt>
              <dd className="text-neutral-600">{product.isFeatured ? "Yes" : "No"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">Barcode:</dt>
              <dd className="text-neutral-600">{product.barcode ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-neutral-700">GST:</dt>
              <dd className="text-neutral-600">
                {Number(product.gstRate)}% ({product.gstInclusive ? "included in price" : "added on top"})
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Images</h2>
          {product.images.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">No images.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-3">
              {product.images.map((image) => (
                <img
                  key={image}
                  src={resolveImageUrl(image)}
                  alt=""
                  className="h-20 w-20 rounded-md border border-neutral-200 object-cover"
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-6 pb-4">
          <h2 className="text-base font-semibold text-neutral-900">Product logs</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Net change of {netChange >= 0 ? "+" : ""}
            {netChange} unit{Math.abs(netChange) === 1 ? "" : "s"} across {productLogs.length} entr
            {productLogs.length === 1 ? "y" : "ies"}.
          </p>
        </div>
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Details</th>
              <th className="px-4 py-3 text-right font-medium">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {productLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  No stock activity yet.
                </td>
              </tr>
            ) : (
              productLogs.map((entry) => (
                <tr key={`${entry.type}-${entry.id}`}>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(entry.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        entry.type === "order" ? "bg-sky-100 text-sky-700" : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {entry.type === "order" ? "Order" : "Manual"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {entry.type === "order" ? (
                      <>
                        <Link to={`/admin/orders/${entry.order.id}`} className="font-medium text-neutral-900 hover:underline">
                          #{entry.order.id.slice(0, 8).toUpperCase()}
                        </Link>{" "}
                        —{" "}
                        {entry.order.user
                          ? [entry.order.user.firstName, entry.order.user.lastName].filter(Boolean).join(" ") ||
                            entry.order.user.email
                          : `${entry.order.guestName || "Walk-in customer"} (POS)`}
                      </>
                    ) : (
                      <>
                        Manual adjustment
                        {entry.admin && (
                          <>
                            {" "}
                            by{" "}
                            {[entry.admin.firstName, entry.admin.lastName].filter(Boolean).join(" ") ||
                              entry.admin.email}
                          </>
                        )}
                      </>
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      entry.delta < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta}
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
