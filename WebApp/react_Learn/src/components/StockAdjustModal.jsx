import { useState } from "react";

// Parent must render this with `key={product.id}` so switching products remounts
// the form with fresh state, instead of syncing state to prop changes via an effect.
export function StockAdjustModal({ product, onSubmit, onCancel }) {
  const [mode, setMode] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!product) return null;

  const parsedQuantity = Number(quantity);
  const hasValidQuantity = quantity !== "" && Number.isInteger(parsedQuantity) && parsedQuantity > 0;
  const delta = mode === "add" ? parsedQuantity : -parsedQuantity;
  const resultingStock = hasValidQuantity ? product.stock + delta : product.stock;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!hasValidQuantity) {
      setError("Enter a whole number greater than 0.");
      return;
    }
    if (resultingStock < 0) {
      setError(`Cannot reduce stock below 0 (current stock: ${product.stock}).`);
      return;
    }

    setSaving(true);
    try {
      await onSubmit(delta);
    } catch (err) {
      setError(err.data?.error ?? "Failed to update stock.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-base font-semibold text-neutral-900">Update stock</h2>
        <p className="mt-1 text-sm text-neutral-500">{product.name}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("add")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === "add" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              Add stock
            </button>
            <button
              type="button"
              onClick={() => setMode("reduce")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === "reduce" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              Reduce stock
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Quantity</label>
            <input
              type="number"
              min="1"
              step="1"
              autoFocus
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-sm">
            <span className="text-neutral-500">Current: {product.stock}</span>
            <span className="font-medium text-neutral-900">
              New: {hasValidQuantity ? resultingStock : "—"}
            </span>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
