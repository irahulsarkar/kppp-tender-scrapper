import { formatCurrency, formatDate, formatDateTime } from "../utils/formatters.js";

function SortButton({ label, sortKey, activeSortBy, activeSortOrder, onSort }) {
  const isActive = activeSortBy === sortKey;
  const arrow = isActive ? (activeSortOrder === "asc" ? "↑" : "↓") : "";

  return (
    <button
      className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900"
      onClick={() => onSort(sortKey)}
      type="button"
    >
      {label} {arrow}
    </button>
  );
}

export default function TenderTable({
  tenders,
  loading,
  sortBy,
  sortOrder,
  onSort,
  total
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">Live Tender Table</h3>
        <p className="text-xs text-slate-500">Showing {tenders.length} of {total}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Tender Number</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Entity</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Location</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Tender Name</th>
              <th className="px-4 py-3 text-left">
                <SortButton
                  label="Estimated Value"
                  sortKey="estimated_value"
                  activeSortBy={sortBy}
                  activeSortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton
                  label="NIT Date"
                  sortKey="published_date"
                  activeSortBy={sortBy}
                  activeSortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton
                  label="Bid Closure"
                  sortKey="closing_date"
                  activeSortBy={sortBy}
                  activeSortOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">AI Type</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && tenders.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                  No tenders found for current filters.
                </td>
              </tr>
            )}

            {tenders.map((tender) => (
              <tr key={`${tender.sourceTab}-${tender.tenderNumber}`} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{tender.tenderNumber}</td>
                <td className="px-4 py-3 text-slate-600">{tender.entity || "N/A"}</td>
                <td className="px-4 py-3 text-slate-600">{tender.location || "N/A"}</td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-700" title={tender.tenderName}>
                  {tender.tenderName || "N/A"}
                </td>
                <td className="px-4 py-3 text-slate-700">{formatCurrency(tender.estimatedValue)}</td>
                <td className="px-4 py-3 text-slate-700">{formatDate(tender.publishedDate)}</td>
                <td className="px-4 py-3 text-slate-700">{formatDateTime(tender.closingDate)}</td>
                <td className="px-4 py-3 text-slate-700">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs uppercase">
                    {tender.type || tender.sourceTab}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                    {tender.aiCategory || "General Services"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {tender.detailUrl ? (
                      <a
                        href={tender.detailUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-100"
                      >
                        View Details
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">No details</span>
                    )}

                    {tender.downloadUrl ? (
                      <a
                        href={tender.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        Download Tender
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
