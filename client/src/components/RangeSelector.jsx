// Range selector - reusable time range picker
const RANGES = [
  { value: '7d', label: '7 Tage' },
  { value: '30d', label: '30 Tage' },
  { value: '90d', label: '3 Monate' },
  { value: '180d', label: '6 Monate' },
  { value: '1y', label: '1 Jahr' },
  { value: 'all', label: 'Alles' },
];

export default function RangeSelector({ value, onChange }) {
  return (
    <div className="flex gap-1 bg-spotify-darkgray rounded-full p-1">
      {RANGES.map(r => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            value === r.value
              ? 'bg-white text-black'
              : 'text-spotify-lightgray hover:text-white'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
