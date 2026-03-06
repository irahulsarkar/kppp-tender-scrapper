import { Activity, IndianRupee, Timer } from "lucide-react";

function Card({ icon: Icon, title, value, accent }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-lg p-2 ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function DashboardCards({ cards }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card
        icon={Activity}
        title="Live Tenders"
        value={cards.liveTenders ?? 0}
        accent="bg-cyan-100 text-cyan-700"
      />
      <Card
        icon={Timer}
        title="Tenders Closing Today"
        value={cards.closingToday ?? 0}
        accent="bg-amber-100 text-amber-700"
      />
      <Card
        icon={IndianRupee}
        title="High Value Tenders (> 1 Crore)"
        value={cards.highValueTenders ?? 0}
        accent="bg-emerald-100 text-emerald-700"
      />
    </div>
  );
}
