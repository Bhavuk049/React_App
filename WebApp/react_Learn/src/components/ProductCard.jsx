import { Link } from "react-router-dom";
import { resolveImageUrl } from "../utils/images.js";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ProductCard({ product }) {
  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
        <img
          src={resolveImageUrl(product.images?.[0])}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {hasDiscount && (
          <span className="absolute bottom-2 left-2 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white">
            Sale
          </span>
        )}
        {product.stock === 0 ? (
          <span className="absolute left-2 top-2 rounded-full bg-neutral-900/80 px-2.5 py-1 text-xs font-medium text-white">
            Out of stock
          </span>
        ) : (
          product.stock <= 5 && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-medium text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Only {product.stock} left — buy fast!
            </span>
          )
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm text-neutral-500">{product.category?.name}</p>
        <h3 className="text-sm font-medium text-neutral-900">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-900">{currency.format(product.price)}</span>
          {hasDiscount && (
            <span className="text-sm text-neutral-400 line-through">
              {currency.format(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
