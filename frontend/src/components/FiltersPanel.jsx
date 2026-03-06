export default function FiltersPanel({
  filters,
  departments,
  districts,
  aiCategories,
  onChange,
  onReset,
  onExportCsv,
  onExportXlsx
}) {
  return (
    <div className="card p-4">
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        <input
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Search Tender Number"
          value={filters.search}
          onChange={(event) => onChange("search", event.target.value)}
        />

        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={filters.department}
          onChange={(event) => onChange("department", event.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={filters.district}
          onChange={(event) => onChange("district", event.target.value)}
        >
          <option value="">All Districts / Locations</option>
          {districts.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={filters.aiCategory}
          onChange={(event) => onChange("aiCategory", event.target.value)}
        >
          <option value="">All AI Tender Types</option>
          {aiCategories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <input
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          type="number"
          min="0"
          placeholder="Min Estimated Value"
          value={filters.minValue}
          onChange={(event) => onChange("minValue", event.target.value)}
        />

        <input
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          type="number"
          min="0"
          placeholder="Max Estimated Value"
          value={filters.maxValue}
          onChange={(event) => onChange("maxValue", event.target.value)}
        />

        <input
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          type="date"
          value={filters.closingDate}
          onChange={(event) => onChange("closingDate", event.target.value)}
        />

        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={filters.sortBy}
          onChange={(event) => onChange("sortBy", event.target.value)}
        >
          <option value="closing_date">Sort: Closing Date</option>
          <option value="estimated_value">Sort: Estimated Value</option>
          <option value="published_date">Sort: Published Date</option>
          <option value="updated_at">Sort: Latest Updated</option>
        </select>

        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={filters.sortOrder}
          onChange={(event) => onChange("sortOrder", event.target.value)}
        >
          <option value="asc">Sort Order: Asc</option>
          <option value="desc">Sort Order: Desc</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onReset}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Reset Filters
        </button>
        <button
          onClick={onExportCsv}
          className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          Export CSV
        </button>
        <button
          onClick={onExportXlsx}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Export Excel
        </button>
      </div>
    </div>
  );
}
