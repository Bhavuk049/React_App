import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProducts } from "../api/products.js";
import { listCategories } from "../api/categories.js";
import { ProductCard } from "../components/ProductCard.jsx";

export function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listProducts({ featured: true, pageSize: 4 }), listCategories()])
      .then(([productsData, categoriesData]) => {
        setFeatured(productsData.products);
        setCategories(categoriesData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
            Everyday essentials, uniquely picked.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-neutral-500">
            Discover apparel, accessories, and home goods curated for quality and style.
          </p>
          <Link
            to="/products"
            className="mt-8 inline-block rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Shop the collection
          </Link>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-neutral-900">Shop by category</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/products?category=${c.slug}`}
                className="rounded-lg border border-neutral-200 p-6 text-center transition-colors hover:border-neutral-400"
              >
                <p className="font-medium text-neutral-900">{c.name}</p>
                {c.description && <p className="mt-1 text-sm text-neutral-500">{c.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-neutral-900">Featured products</h2>
        {loading ? (
          <p className="mt-6 text-sm text-neutral-500">Loading...</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
