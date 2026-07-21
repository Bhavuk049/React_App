import { useState } from "react";
import {
  useAdminListCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "../../store/api/categoriesApi.js";
import { ConfirmModal } from "../../components/ConfirmModal.jsx";

export function AdminCategoriesPage() {
  const { data: categories = [] } = useAdminListCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [pendingToggle, setPendingToggle] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await createCategory({ name, slug }).unwrap();
      setName("");
      setSlug("");
    } catch (err) {
      setError(err.data?.error ?? "Failed to create category.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this category?")) return;
    setError("");
    try {
      await deleteCategory(id).unwrap();
    } catch (err) {
      setError(err.data?.error ?? "Failed to delete category.");
    }
  }

  async function confirmTogglePublished() {
    const category = pendingToggle;
    setPendingToggle(null);
    setError("");
    try {
      await updateCategory({ id: category.id, payload: { isActive: !category.isActive } }).unwrap();
    } catch (err) {
      setError(err.data?.error ?? "Failed to update category.");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Categories</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap items-end gap-4 rounded-lg border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Slug</label>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
          Add category
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{c.name}</td>
                <td className="px-4 py-3 text-neutral-500">{c.slug}</td>
                <td className="px-4 py-3 text-neutral-500">{c._count.products}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setPendingToggle(c)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      c.isActive ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {c.isActive ? "Published" : "Unpublished"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={c._count.products > 0}
                    title={
                      c._count.products > 0
                        ? "Move or delete this category's products before deleting it"
                        : "Delete"
                    }
                    aria-label="Delete"
                    className="inline-flex rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
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
        title={pendingToggle?.isActive ? "Unpublish this category?" : "Publish this category?"}
        message={
          pendingToggle?.isActive
            ? "Its products will be hidden from the storefront until you publish it again."
            : "This category and its products will become visible on the storefront."
        }
        confirmLabel={pendingToggle?.isActive ? "Unpublish" : "Publish"}
        onConfirm={confirmTogglePublished}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}
