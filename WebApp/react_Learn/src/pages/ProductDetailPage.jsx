import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useGetProductQuery } from "../store/api/productsApi.js";
import { useCart } from "../hooks/useCart.js";
import { resolveImageUrl } from "../utils/images.js";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { data: product, isError } = useGetProductQuery(slug);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [slug]);

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-neutral-500">Product not found.</p>
        <Link to="/products" className="mt-4 inline-block text-sm font-medium text-neutral-900 underline">
          Back to shop
        </Link>
      </div>
    );
  }

  if (!product) {
    return <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">Loading...</div>;
  }

  const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);

  function handleAddToCart() {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg bg-neutral-100">
            <img
              src={resolveImageUrl(product.images?.[activeImage] ?? product.images?.[0])}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`h-16 w-16 overflow-hidden rounded-md border ${
                    index === activeImage ? "border-neutral-900" : "border-neutral-200"
                  }`}
                >
                  <img src={resolveImageUrl(image)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-neutral-500">{product.category?.name}</p>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-xl font-semibold text-neutral-900">{currency.format(product.price)}</span>
            {hasDiscount && (
              <span className="text-neutral-400 line-through">{currency.format(product.compareAtPrice)}</span>
            )}
          </div>

          <p className="mt-6 text-neutral-600">{product.description}</p>

          {product.stock > 0 ? (
            <>
              <p className="mt-4 text-sm text-neutral-500">{product.stock} in stock</p>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center rounded-md border border-neutral-200">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-neutral-600 hover:text-neutral-900"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-2 text-neutral-600 hover:text-neutral-900"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  {added ? "Added!" : "Add to cart"}
                </button>
              </div>
            </>
          ) : (
            <p className="mt-6 inline-block rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-500">
              Out of stock
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
