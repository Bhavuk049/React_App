import { useState } from "react";
import { useAdminListProductsQuery } from "../../store/api/productsApi.js";
import { useListCategoriesQuery } from "../../store/api/categoriesApi.js";
import { useAdminDashboardStatsQuery } from "../../store/api/ordersApi.js";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const exactCurrency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const compactCurrency = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const monthLabelFormat = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });
const fullDateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

function parseDate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function MonthlyEarningsChart({ chart, loading, onPrevMonth, onNextMonth }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const days = chart?.days ?? [];
  const maxTotal = Math.max(1, ...days.map((d) => d.total));

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">Monthly earnings</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {chart ? monthLabelFormat.format(parseDate(chart.startDate)) : "—"}
            {chart?.isCurrentMonth && (
              <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                This month
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
          >
            &#8249;
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            disabled={chart?.isCurrentMonth}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300"
          >
            &#8250;
          </button>
        </div>
      </div>

      <div className="mt-6 h-56">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">Loading...</div>
        ) : (
          <div className="h-full overflow-x-auto">
            {/* pt-9 reserves headroom inside this box for the hover tooltip: overflow-x-auto
                forces overflow-y to clip too, so the tooltip must stay within these bounds. */}
            <div className="inline-flex h-full min-w-full items-end gap-1 pt-9">
              {days.map((day, index) => {
                const heightPct = day.total > 0 ? Math.max(4, (day.total / maxTotal) * 100) : 0;
                const isHovered = hoverIndex === index;
                return (
                  <div
                    key={day.date}
                    className="relative flex h-full w-9 shrink-0 flex-col items-center justify-end"
                    onMouseEnter={() => setHoverIndex(index)}
                    onMouseLeave={() => setHoverIndex((current) => (current === index ? null : current))}
                  >
                    {isHovered && (
                      <div className="absolute -top-1 z-20 -translate-y-full whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white shadow-sm">
                        {exactCurrency.format(day.total)} · {fullDateFormat.format(parseDate(day.date))}
                      </div>
                    )}
                    {day.total > 0 && (
                      <p className="mb-1 whitespace-nowrap text-[9px] font-medium text-neutral-500">
                        {compactCurrency.format(day.total)}
                      </p>
                    )}
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className={`w-full rounded-t-md transition-colors ${
                          isHovered ? "bg-indigo-600" : "bg-indigo-500"
                        }`}
                        style={{ height: `${heightPct}%`, minHeight: day.total > 0 ? "4px" : "1px" }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] font-medium text-neutral-400">{parseDate(day.date).getDate()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [monthOffset, setMonthOffset] = useState(0);
  const { data: productsData } = useAdminListProductsQuery({ pageSize: 1 });
  const { data: categories = [] } = useListCategoriesQuery();
  const { data: dashboardStats, isFetching: loadingStats } = useAdminDashboardStatsQuery({ monthOffset });
  const stats = { products: productsData?.pagination.total ?? 0, categories: categories.length };

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm text-neutral-500">Today's sales</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">
            {currency.format(dashboardStats?.todayTotal ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm text-neutral-500">This week's sales</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">
            {currency.format(dashboardStats?.weekTotal ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm text-neutral-500">Total products</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">{stats.products}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm text-neutral-500">Categories</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">{stats.categories}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-sm text-neutral-500">Total stock value</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-900">
            {currency.format(dashboardStats?.totalStockValue ?? 0)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <MonthlyEarningsChart
          chart={dashboardStats?.chart}
          loading={loadingStats}
          onPrevMonth={() => setMonthOffset((offset) => offset - 1)}
          onNextMonth={() => setMonthOffset((offset) => Math.min(0, offset + 1))}
        />
      </div>
    </div>
  );
}
