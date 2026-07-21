import { Link } from "react-router-dom";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ProductCard({ product }) {
  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
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
