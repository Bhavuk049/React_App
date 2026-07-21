import { useAdminListProductsQuery } from "../../store/api/productsApi.js";
import { useListCategoriesQuery } from "../../store/api/categoriesApi.js";

export function AdminDashboard() {
  const { data: productsData } = useAdminListProductsQuery({ pageSize: 1 });
  const { data: categories = [] } = useListCategoriesQuery();
  const stats = { products: productsData?.pagination.total ?? 0, categories: categories.length };

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
