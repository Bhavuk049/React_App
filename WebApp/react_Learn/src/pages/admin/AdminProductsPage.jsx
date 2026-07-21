import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useAdminListProductsQuery,
  useCreateProductMutation,
  useDeleteProductMutation,
  useUpdateProductMutation,
} from "../../store/api/productsApi.js";
import { useAdminListCategoriesQuery } from "../../store/api/categoriesApi.js";
import { resolveImageUrl } from "../../utils/images.js";
import { ConfirmModal } from "../../components/ConfirmModal.jsx";

const BarcodeScannerModal = lazy(() =>
  import("../../components/BarcodeScannerModal.jsx").then((m) => ({ default: m.BarcodeScannerModal })),
);

const MAX_PRODUCT_IMAGES = 5;
const GST_RATE_OPTIONS = [0, 5, 12, 18, 28];

function SortableHeader({ label, sortKeyName, activeSortKey, sortDirection, onSort }) {
  const isActive = activeSortKey === sortKeyName;
  return (
    <th className="px-4 py-3 font-medium">
      <button onClick={() => onSort(sortKeyName)} className="inline-flex items-center gap-1 hover:text-neutral-900">
        {label}
        <span className={`w-3 shrink-0 text-center text-[10px] ${isActive ? "" : "invisible"}`}>
          {sortDirection === "asc" ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stock: "0",
  categoryId: "",
  barcode: "",
  gstRate: "0",
  gstInclusive: true,
  isFeatured: false,
};

export function AdminProductsPage() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const { data: categories = [] } = useAdminListCategoriesQuery();
  const { data: productsData } = useAdminListProductsQuery({
    pageSize: 100,
    ...(categoryFilter ? { category: categoryFilter } : {}),
  });
  const products = productsData?.products ?? [];
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [pendingToggle, setPendingToggle] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    const previewUrls = newImageFiles.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(previewUrls);
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [newImageFiles]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function getSortValue(product, key) {
    switch (key) {
      case "name":
        return product.name.toLowerCase();
      case "category":
        return product.category?.name?.toLowerCase() ?? "";
      case "price":
        return Number(product.price);
      case "stock":
        return product.stock;
      case "status":
        return product.isActive ? 1 : 0;
      default:
        return "";
    }
  }

  const sortedProducts = sortKey
    ? [...products].sort((a, b) => {
        const valueA = getSortValue(a, sortKey);
        const valueB = getSortValue(b, sortKey);
        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      })
    : products;

  function startCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setExistingImages([]);
    setNewImageFiles([]);
    setShowForm(true);
    setError("");
  }

  function startEdit(product) {
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
      stock: String(product.stock),
      categoryId: product.categoryId,
      barcode: product.barcode ?? "",
      gstRate: String(product.gstRate ?? 0),
      gstInclusive: product.gstInclusive,
      isFeatured: product.isFeatured,
    });
    setEditingId(product.id);
    setExistingImages(product.images);
    setNewImageFiles([]);
    setShowForm(true);
    setError("");
  }

  function handleImagesSelected(e) {
    const selected = Array.from(e.target.files || []);
    const capacity = MAX_PRODUCT_IMAGES - existingImages.length - newImageFiles.length;

    if (selected.length > capacity) {
      setError(`You can only add up to ${MAX_PRODUCT_IMAGES} images per product.`);
    }
    setNewImageFiles((prev) => [...prev, ...selected.slice(0, Math.max(capacity, 0))]);
    e.target.value = "";
  }

  function removeExistingImage(index) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewImage(index) {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (existingImages.length + newImageFiles.length === 0) {
      setError("Add at least one product image.");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("slug", form.slug);
    formData.append("description", form.description);
    formData.append("price", form.price);
    formData.append("stock", form.stock);
    formData.append("categoryId", form.categoryId);
    formData.append("barcode", form.barcode.trim());
    formData.append("gstRate", form.gstRate);
    formData.append("gstInclusive", String(form.gstInclusive));
    formData.append("isFeatured", String(form.isFeatured));
    if (form.compareAtPrice) formData.append("compareAtPrice", form.compareAtPrice);
    if (editingId) formData.append("existingImages", JSON.stringify(existingImages));
    newImageFiles.forEach((file) => formData.append("images", file));

    try {
      if (editingId) {
        await updateProduct({ id: editingId, formData }).unwrap();
      } else {
        await createProduct(formData).unwrap();
      }
      setShowForm(false);
    } catch (err) {
      setError(err.data?.error ?? "Failed to save product.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id).unwrap();
  }

  async function confirmTogglePublished() {
    const product = pendingToggle;
    setPendingToggle(null);
    setError("");
    try {
      const formData = new FormData();
      formData.append("isActive", String(!product.isActive));
      await updateProduct({ id: product.id, formData }).unwrap();
    } catch (err) {
      setError(err.data?.error ?? "Failed to update product.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Products</h1>
        <button
          onClick={startCreate}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Add product
        </button>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-neutral-700">Filter by category</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="mt-1 w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
              {!c.isActive ? " (unpublished)" : ""}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Slug</label>
            <input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Price</label>
            <input
              type="number"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Compare-at price</label>
            <input
              type="number"
              value={form.compareAtPrice}
              onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Stock</label>
            <input
              type="number"
              required
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Category *</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {!c.isActive ? " (unpublished)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700">Barcode (optional)</label>
            <div className="mt-1 flex gap-2">
              <input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="Enter or scan a barcode"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="shrink-0 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Scan
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">GST rate</label>
            <select
              value={form.gstRate}
              onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              {GST_RATE_OPTIONS.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Price and GST</label>
            <select
              value={form.gstInclusive ? "inclusive" : "exclusive"}
              onChange={(e) => setForm({ ...form, gstInclusive: e.target.value === "inclusive" })}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="inclusive">GST included in price</option>
              <option value="exclusive">GST excluded from price</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700">
              Product images ({existingImages.length + newImageFiles.length}/{MAX_PRODUCT_IMAGES})
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImagesSelected}
              disabled={existingImages.length + newImageFiles.length >= MAX_PRODUCT_IMAGES}
              className="mt-1 w-full text-sm text-neutral-600"
            />
            {(existingImages.length > 0 || newImagePreviews.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-3">
                {existingImages.map((url, index) => (
                  <div key={url} className="relative h-20 w-20 overflow-hidden rounded-md border border-neutral-200">
                    <img src={resolveImageUrl(url)} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-black/60 text-xs leading-none text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {newImagePreviews.map((url, index) => (
                  <div key={url} className="relative h-20 w-20 overflow-hidden rounded-md border border-neutral-200">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-black/60 text-xs leading-none text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            />
            Featured product
          </label>

          {!editingId && (
            <p className="text-sm text-neutral-500 sm:col-span-2">
              New products are created unpublished. Use the status toggle in the table to publish once you're ready.
            </p>
          )}

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              {editingId ? "Save changes" : "Create product"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <SortableHeader
                label="Name"
                sortKeyName="name"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
              />
              <SortableHeader
                label="Category"
                sortKeyName="category"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
              />
              <SortableHeader
                label="Price"
                sortKeyName="price"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
              />
              <SortableHeader
                label="Stock"
                sortKeyName="stock"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
              />
              <SortableHeader
                label="Status"
                sortKeyName="status"
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={toggleSort}
              />
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sortedProducts.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  <Link to={`/admin/products/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-500">{p.category?.name}</td>
                <td className="px-4 py-3 text-neutral-500">₹{p.price}</td>
                <td className="px-4 py-3">
                  {p.stock === 0 ? (
                    <span className="inline-flex items-center gap-1 font-medium text-red-600">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.401 3.003c.765-1.336 2.833-1.336 3.598 0l6.518 11.4c.75 1.313-.213 2.947-1.798 2.947H4.681c-1.585 0-2.548-1.634-1.798-2.947l6.518-11.4ZM10 7a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 10 7Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      0
                    </span>
                  ) : (
                    <span className="text-neutral-500">{p.stock}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setPendingToggle(p)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      p.isActive ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {p.isActive ? "Published" : "Unpublished"}
                  </button>
                  {p.isActive && p.category && !p.category.isActive && (
                    <p className="mt-1 text-xs text-amber-600">Hidden — category unpublished</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => startEdit(p)}
                    disabled={p.isActive}
                    title={p.isActive ? "Unpublish this product first to edit it" : "Edit"}
                    aria-label="Edit"
                    className="mr-3 inline-flex rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    title="Delete"
                    aria-label="Delete"
                    className="inline-flex rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M8.75 1a.75.75 0 0 0-.75.75V2h-3.25a.75.75 0 0 0 0 1.5h.324l.667 11.35A2.25 2.25 0 0 0 7.986 17h4.028a2.25 2.25 0 0 0 2.245-2.15l.667-11.35h.324a.75.75 0 0 0 0-1.5H12v-.25a.75.75 0 0 0-.75-.75h-2.5ZM8.5 6.25a.75.75 0 0 1 1.5 0v7a.75.75 0 0 1-1.5 0v-7Zm3.5 0a.75.75 0 0 0-1.5 0v7a.75.75 0 0 0 1.5 0v-7Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={pendingToggle !== null}
        title={pendingToggle?.isActive ? "Unpublish this product?" : "Publish this product?"}
        message={
          pendingToggle?.isActive
            ? "It will be hidden from the storefront until you publish it again."
            : "It will become visible on the storefront (unless its category is unpublished)."
        }
        confirmLabel={pendingToggle?.isActive ? "Unpublish" : "Publish"}
        onConfirm={confirmTogglePublished}
        onCancel={() => setPendingToggle(null)}
      />

      {showScanner && (
        <Suspense fallback={null}>
          <BarcodeScannerModal
            onDetected={(code) => {
              setForm((prev) => ({ ...prev, barcode: code }));
              setShowScanner(false);
            }}
            onClose={() => setShowScanner(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
