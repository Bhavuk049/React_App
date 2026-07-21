import { useEffect, useState } from "react";
import { adminListProducts } from "../../api/products.js";
import { listCategories } from "../../api/categories.js";

export function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, categories: 0 });

  useEffect(() => {
    Promise.all([adminListProducts({ pageSize: 1 }), listCategories()]).then(
      ([productsData, categories]) => {
        setStats({ products: productsData.pagination.total, categories: categories.length });
      }
    );
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm text-neutral-500">Total products</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">{stats.products}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm text-neutral-500">Categories</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">{stats.categories}</p>
        </div>
      </div>
    </div>
  );
}
