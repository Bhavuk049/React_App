import { useState } from "react";
import {
  useAdminListCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "../../store/api/categoriesApi.js";
import { ConfirmModal } from "../../components/ConfirmModal.jsx";
import { Icon, SectionHeading } from "../../components/Icon.jsx";
import { ICON_PATHS } from "../../utils/iconPaths.js";

const emptyForm = { name: "", slug: "", description: "" };

const fieldClass =
  "mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400";
const labelClass = "block text-sm font-medium text-neutral-700";

export function AdminCategoriesPage() {
  const { data: categories = [] } = useAdminListCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");
  const [pendingToggle, setPendingToggle] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await createCategory({
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
      }).unwrap();
      setForm(emptyForm);
    } catch (err) {
      setError(err.data?.error ?? "Failed to create category.");
    }
  }

  function startEdit(category) {
    setEditForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
    });
    setEditingId(category.id);
    setEditError("");
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError("");
    try {
      await updateCategory({
        id: editingId,
        payload: {
          name: editForm.name,
          slug: editForm.slug,
          description: editForm.description || null,
        },
      }).unwrap();
      setEditingId(null);
    } catch (err) {
      setEditError(err.data?.error ?? "Failed to update category.");
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
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Icon path={ICON_PATHS.categories} className="h-5 w-5" />
        </span>
        <h1 className="text-xl font-semibold text-neutral-900">Categories</h1>
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <SectionHeading icon={ICON_PATHS.plus}>Add category</SectionHeading>
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description (optional)</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Icon path={ICON_PATHS.plus} className="h-4 w-4" />
              Add category
            </button>
          </div>
        </form>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Products</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-50/60">
                <td className="px-4 py-3 font-medium text-neutral-900">{c.name}</td>
                <td className="px-4 py-3 text-neutral-500">{c.slug}</td>
                <td className="px-4 py-3 max-w-xs truncate text-neutral-500" title={c.description ?? ""}>
                  {c.description || <span className="text-neutral-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    <Icon path={ICON_PATHS.products} className="h-3.5 w-3.5" />
                    {c._count.products}
                  </span>
                </td>
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
                    onClick={() => startEdit(c)}
                    title="Edit"
                    aria-label="Edit"
                    className="mr-3 inline-flex rounded p-1.5 text-neutral-500 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Icon path={ICON_PATHS.edit} className="h-4 w-4" />
                  </button>
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
                    <Icon path={ICON_PATHS.trash} className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Icon path={ICON_PATHS.edit} className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-semibold text-neutral-900">Edit category</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                aria-label="Close"
                className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <Icon path={ICON_PATHS.close} className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Slug</label>
                <input
                  required
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description (optional)</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className={fieldClass}
                />
              </div>

              {editError && <p className="text-sm text-red-600">{editError}</p>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Icon path={ICON_PATHS.check} className="h-4 w-4" />
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
