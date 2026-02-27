// Reusable stat card
export default function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className="card group">
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-3xl font-bold ${accent || 'text-white'}`}>{value}</div>
          <div className="text-sm text-spotify-lightgray mt-1">{label}</div>
          {sub && <div className="text-xs text-spotify-lightgray mt-0.5 opacity-70">{sub}</div>}
        </div>
        {icon && (
          <span className="text-2xl opacity-60">{icon}</span>
        )}
      </div>
    </div>
  );
}
