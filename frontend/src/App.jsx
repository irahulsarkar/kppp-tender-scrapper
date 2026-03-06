import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import api from "./api/client.js";
import AnalyticsChart from "./components/AnalyticsChart.jsx";
import DashboardCards from "./components/DashboardCards.jsx";
import FiltersPanel from "./components/FiltersPanel.jsx";
import TenderTable from "./components/TenderTable.jsx";

const AUTO_REFRESH_MS = 30 * 60 * 1000;

const AI_CATEGORY_OPTIONS = [
  "IT",
  "Civil",
  "Electrical",
  "Mechanical",
  "Healthcare",
  "Consultancy",
  "Water & Sanitation",
  "Transport",
  "Security",
  "Supply",
  "General Services"
];

const INITIAL_FILTERS = {
  search: "",
  department: "",
  district: "",
  aiCategory: "",
  minValue: "",
  maxValue: "",
  closingDate: "",
  sortBy: "closing_date",
  sortOrder: "asc"
};

function cleanParams(filters, category) {
  const params = {
    ...filters,
    tab: category === "all" ? undefined : category,
    page: 1,
    limit: 200
  };

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function getApiPathByCategory(category) {
  if (category === "works") {
    return "/api/tenders/works";
  }
  if (category === "services") {
    return "/api/tenders/services";
  }
  if (category === "goods") {
    return "/api/tenders/goods";
  }
  return "/api/tenders";
}

export default function App() {
  const [category, setCategory] = useState("all");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [tenders, setTenders] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    cards: { liveTenders: 0, closingToday: 0, highValueTenders: 0 },
    byTab: [],
    trend: [],
    latestRun: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = cleanParams(filters, category);
      const endpoint = getApiPathByCategory(category);

      const [tenderResponse, analyticsResponse] = await Promise.all([
        api.get(endpoint, { params }),
        api.get("/api/analytics/summary")
      ]);

      setTenders(tenderResponse.data?.items || []);
      setTotal(tenderResponse.data?.total || 0);
      setSummary({
        cards: analyticsResponse.data?.cards || {
          liveTenders: 0,
          closingToday: 0,
          highValueTenders: 0
        },
        byTab: analyticsResponse.data?.byTab || [],
        trend: analyticsResponse.data?.trend || [],
        latestRun: analyticsResponse.data?.latestRun || null
      });
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to load tenders."
      );
    } finally {
      setLoading(false);
    }
  }, [category, filters]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const interval = setInterval(fetchDashboard, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const departments = useMemo(() => {
    return [...new Set(tenders.map((item) => item.entity).filter(Boolean))].sort();
  }, [tenders]);

  const districts = useMemo(() => {
    return [...new Set(tenders.map((item) => item.location).filter(Boolean))].sort();
  }, [tenders]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleSortFromTable = (sortKey) => {
    setFilters((current) => {
      const isSameKey = current.sortBy === sortKey;
      const nextOrder = isSameKey && current.sortOrder === "asc" ? "desc" : "asc";
      return {
        ...current,
        sortBy: sortKey,
        sortOrder: nextOrder
      };
    });
  };

  const triggerRealtimeSync = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await api.post("/api/scrape/trigger");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to trigger live sync."
      );
    } finally {
      await fetchDashboard();
    }
  }, [fetchDashboard]);

  const openExport = (format) => {
    const params = cleanParams(filters, category);
    delete params.page;
    delete params.limit;
    const query = new URLSearchParams(params).toString();
    const path = `/api/tenders/export/${format}${query ? `?${query}` : ""}`;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    window.open(`${baseUrl}${path}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-[1500px] space-y-4 p-4 md:p-6">
        <header className="card flex flex-wrap items-start justify-between gap-3 p-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">KPPP Live Tenders Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Karnataka Public Procurement Portal tender intelligence
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Auto refresh every 30 minutes
              {lastUpdated ? ` • Last updated: ${lastUpdated.toLocaleString()}` : ""}
            </p>
            {summary.latestRun && (
              <p className="mt-1 text-xs text-slate-500">
                Latest scrape: {summary.latestRun.status} ({summary.latestRun.row_count} rows)
              </p>
            )}
          </div>
          <button
            onClick={triggerRealtimeSync}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh now
          </button>
        </header>

        <DashboardCards cards={summary.cards} />

        <div className="card p-3">
          <div className="flex flex-wrap gap-2">
            {["all", "goods", "works", "services"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                  category === tab
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <FiltersPanel
          filters={filters}
          departments={departments}
          districts={districts}
          aiCategories={AI_CATEGORY_OPTIONS}
          onChange={handleFilterChange}
          onReset={() => setFilters(INITIAL_FILTERS)}
          onExportCsv={() => openExport("csv")}
          onExportXlsx={() => openExport("xlsx")}
        />

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <TenderTable
          tenders={tenders}
          total={total}
          loading={loading}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSort={handleSortFromTable}
        />

        <AnalyticsChart byTab={summary.byTab} trend={summary.trend} />
      </div>
    </div>
  );
}
