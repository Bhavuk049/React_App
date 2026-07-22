import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetProductQuery, useListProductsQuery } from "../store/api/productsApi.js";
import { useGetSettingsQuery } from "../store/api/settingsApi.js";
import { useCart } from "../hooks/useCart.js";
import { resolveImageUrl } from "../utils/images.js";
import { ProductCard } from "../components/ProductCard.jsx";
import { Icon } from "../components/Icon.jsx";
import { ICON_PATHS } from "../utils/iconPaths.js";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { data: product, isError } = useGetProductQuery(slug);
  const { data: settings } = useGetSettingsQuery();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { data: relatedData } = useListProductsQuery(
    product?.category?.slug ? { category: product.category.slug, pageSize: 5 } : undefined,
    { skip: !product?.category?.slug },
  );
  const related = (relatedData?.products ?? []).filter((p) => p.id !== product?.id).slice(0, 4);

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

  function handleBuyNow() {
    addItem(product, quantity);
    navigate("/checkout");
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl bg-neutral-100">
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
                    index === activeImage ? "border-rose-500" : "border-neutral-200"
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
          <h1 className="font-display mt-1 text-3xl font-semibold text-neutral-900">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-xl font-semibold text-neutral-900">{currency.format(product.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-neutral-400 line-through">{currency.format(product.compareAtPrice)}</span>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">Sale</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-400">Taxes included.</p>

          <p className="mt-6 whitespace-pre-line text-neutral-600">{product.description}</p>

          {product.stock > 0 ? (
            <>
              {product.stock <= 5 ? (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  Only {product.stock} left in stock — order soon!
                </p>
              ) : (
                <p className="mt-4 text-sm text-emerald-600">In stock</p>
              )}

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center rounded-md border border-neutral-200">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-neutral-600 hover:text-rose-600"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-2 text-neutral-600 hover:text-rose-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <button
                  onClick={handleAddToCart}
                  className="w-full rounded-full border-2 border-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-900 hover:text-white"
                >
                  {added ? "Added!" : "Add to cart"}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-500/30 hover:bg-rose-600"
                >
                  Buy it now
                </button>
              </div>
            </>
          ) : (
            <p className="mt-6 inline-block rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-500">
              Out of stock
            </p>
          )}

          <button
            onClick={handleShare}
            className="mt-6 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-rose-600"
          >
            <Icon path={ICON_PATHS.share} className="h-4 w-4" />
            {shared ? "Link copied!" : "Share"}
          </button>

          {settings?.city && (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-neutral-600">
              <Icon path={ICON_PATHS.check} className="h-4 w-4 text-emerald-600" />
              Pickup available at our {settings.city} store
            </p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold text-neutral-900">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
