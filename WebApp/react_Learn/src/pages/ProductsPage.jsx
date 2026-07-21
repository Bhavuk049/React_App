import { useSearchParams } from "react-router-dom";
import { useListProductsQuery } from "../store/api/productsApi.js";
import { useListCategoriesQuery } from "../store/api/categoriesApi.js";
import { ProductCard } from "../components/ProductCard.jsx";

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? "";

  const { data: categories = [] } = useListCategoriesQuery();
  const { data: productsData, isLoading: loading } = useListProductsQuery({
    category: category || undefined,
    pageSize: 24,
  });
  const products = productsData?.products ?? [];

  function selectCategory(slug) {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Shop</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => selectCategory("")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
            !category
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => selectCategory(c.slug)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              category === c.slug
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-neutral-500">Loading...</p>
      ) : products.length === 0 ? (
        <p className="mt-10 text-sm text-neutral-500">No products found.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
