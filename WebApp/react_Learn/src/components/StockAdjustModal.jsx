import { useState } from "react";
import { Icon } from "./Icon.jsx";
import { ICON_PATHS } from "../utils/iconPaths.js";

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
  const isAdd = mode === "add";

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
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Icon path={ICON_PATHS.bag} className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Update stock</h2>
            <p className="text-sm text-neutral-500">{product.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("add")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === "add" ? "bg-emerald-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-emerald-50"
              }`}
            >
              <Icon path={ICON_PATHS.plusCircle} className="h-4 w-4" />
              Add stock
            </button>
            <button
              type="button"
              onClick={() => setMode("reduce")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                mode === "reduce" ? "bg-rose-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-rose-50"
              }`}
            >
              <Icon path={ICON_PATHS.minusCircle} className="h-4 w-4" />
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
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-sm">
            <span className="text-neutral-500">Current: {product.stock}</span>
            <span className={`font-medium ${hasValidQuantity ? (isAdd ? "text-emerald-600" : "text-rose-600") : "text-neutral-900"}`}>
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
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-400 ${
                isAdd ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {!saving && <Icon path={ICON_PATHS.check} className="h-4 w-4" />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
