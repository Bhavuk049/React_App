import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-neutral-500">Your cart is empty.</p>
        <Link to="/products" className="mt-4 inline-block text-sm font-medium text-neutral-900 underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Your cart</h1>

      <ul className="mt-8 divide-y divide-neutral-200">
        {items.map(({ product, quantity }) => (
          <li key={product.id} className="flex items-center gap-4 py-6">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100">
              <img src={product.images?.[0]} alt={product.name} className="h-full w-full object-cover" />
            </div>

            <div className="flex-1">
              <p className="font-medium text-neutral-900">{product.name}</p>
              <p className="text-sm text-neutral-500">{currency.format(product.price)}</p>
            </div>

            <div className="flex items-center rounded-md border border-neutral-200">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900"
              >
                -
              </button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900"
              >
                +
              </button>
            </div>

            <p className="w-24 text-right font-medium text-neutral-900">
              {currency.format(product.price * quantity)}
            </p>

            <button
              onClick={() => removeItem(product.id)}
              className="text-sm text-neutral-400 hover:text-neutral-700"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-6">
        <span className="text-lg font-semibold text-neutral-900">Total</span>
        <span className="text-lg font-semibold text-neutral-900">{currency.format(totalPrice)}</span>
      </div>

      <button className="mt-6 w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800">
        Checkout
      </button>
    </div>
  );
}
