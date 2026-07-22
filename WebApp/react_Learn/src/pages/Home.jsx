import { Link } from "react-router-dom";
import { useListProductsQuery } from "../store/api/productsApi.js";
import { useListCategoriesQuery } from "../store/api/categoriesApi.js";
import { useGetSettingsQuery } from "../store/api/settingsApi.js";
import { ProductCard } from "../components/ProductCard.jsx";
import { resolveImageUrl } from "../utils/images.js";
import { Icon } from "../components/Icon.jsx";
import { ICON_PATHS } from "../utils/iconPaths.js";

const TILE_ACCENTS = [
  "from-rose-100 to-pink-50",
  "from-amber-100 to-orange-50",
  "from-sky-100 to-cyan-50",
  "from-violet-100 to-purple-50",
  "from-emerald-100 to-teal-50",
];

export function Home() {
  const { data: featuredData, isLoading: featuredLoading } = useListProductsQuery({ featured: true, pageSize: 4 });
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useListProductsQuery({ pageSize: 8 });
  const { data: categories = [] } = useListCategoriesQuery();
  const { data: settings } = useGetSettingsQuery();

  const featured = featuredData?.products ?? [];
  const newArrivals = newArrivalsData?.products ?? [];
  const heroImages = (featured.length > 0 ? featured : newArrivals).slice(0, 3);

  function categoryImage(category) {
    const match = newArrivals.find((p) => p.categoryId === category.id && p.images?.[0]);
    return match ? resolveImageUrl(match.images[0]) : null;
  }

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 rounded-3xl border border-rose-200/60 bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 p-8 shadow-lg shadow-rose-200/50 sm:p-12 lg:grid-cols-2">
          <div>
            <p className="font-display flex items-center gap-1.5 text-sm font-semibold text-rose-500">
              <Icon path={ICON_PATHS.sparkles} className="h-4 w-4" />
              Handpicked happiness for you
            </p>
            <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
              Everyday essentials, uniquely picked.
            </h1>
            <p className="mt-4 max-w-md text-neutral-600">
              Discover apparel, accessories, and home goods curated for quality and style.
            </p>
            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-rose-500/30 hover:bg-rose-600"
            >
              Shop the collection
              <Icon path={ICON_PATHS.arrowRight} className="h-4 w-4" />
            </Link>
          </div>

          {heroImages.length > 0 && (
            <div className="relative hidden h-72 sm:block">
              {heroImages.map((product, index) => (
                <img
                  key={product.id}
                  src={resolveImageUrl(product.images?.[0])}
                  alt={product.name}
                  className="absolute rounded-2xl border-4 border-white object-cover shadow-lg"
                  style={{
                    width: index === 0 ? "60%" : "42%",
                    height: index === 0 ? "100%" : "60%",
                    left: index === 0 ? "0%" : index === 1 ? "55%" : "58%",
                    top: index === 0 ? "0%" : index === 1 ? "0%" : "42%",
                    transform: index === 2 ? "rotate(3deg)" : "rotate(-2deg)",
                    zIndex: heroImages.length - index,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-neutral-900">New Arrivals</h2>
          <Link
            to="/products"
            className="hidden items-center gap-1 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 sm:inline-flex"
          >
            View all
            <Icon path={ICON_PATHS.arrowRight} className="h-4 w-4" />
          </Link>
        </div>
        {newArrivalsLoading || featuredLoading ? (
          <p className="mt-6 text-sm text-neutral-500">Loading...</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {newArrivals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <Link
          to="/products"
          className="mt-8 flex items-center justify-center gap-1 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-600 sm:hidden"
        >
          View all
          <Icon path={ICON_PATHS.arrowRight} className="h-4 w-4" />
        </Link>
      </section>

      {/* Shop by category */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-neutral-900">Shop by category</h2>
          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {categories.map((c, index) => {
              const image = categoryImage(c);
              return (
                <Link key={c.id} to={`/products?category=${c.slug}`} className="group text-center">
                  <div
                    className={`aspect-square overflow-hidden rounded-2xl bg-gradient-to-br ${
                      TILE_ACCENTS[index % TILE_ACCENTS.length]
                    }`}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="font-display text-4xl font-semibold text-white/70">
                          {c.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-neutral-900 group-hover:text-rose-600">
                    {c.name}
                    <Icon path={ICON_PATHS.arrowRight} className="h-3.5 w-3.5" />
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Get in touch */}
      {(settings?.supportPhone || settings?.supportEmail) && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-rose-200/60 bg-gradient-to-br from-rose-100 to-amber-50 px-6 py-12 text-center shadow-lg shadow-rose-200/50">
            <h2 className="font-display text-3xl font-semibold text-neutral-900">
              Handpicked Happiness For You <span aria-hidden="true">✨</span>
            </h2>
            <p className="mt-2 text-neutral-600">Questions about an order? We're just a call or email away.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {settings?.supportPhone && (
                <a
                  href={`tel:+91${settings.supportPhone}`}
                  className="flex items-center gap-2 rounded-full border border-rose-300 bg-white px-6 py-3 text-sm font-medium text-neutral-800 hover:bg-rose-50"
                >
                  <Icon path={ICON_PATHS.phone} className="h-4 w-4 text-rose-500" />
                  Call us
                </a>
              )}
              {settings?.supportEmail && (
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="flex items-center gap-2 rounded-full border border-rose-300 bg-white px-6 py-3 text-sm font-medium text-neutral-800 hover:bg-rose-50"
                >
                  <Icon path={ICON_PATHS.mail} className="h-4 w-4 text-rose-500" />
                  Email us
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
