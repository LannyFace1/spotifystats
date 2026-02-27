// Top Artists full page
import { useState, useCallback } from 'react';
import { statsApi } from '../services/api';
import { useAsync, formatDuration } from '../hooks/useAsync';
import RangeSelector from '../components/RangeSelector';
import { LoadingScreen } from '../components/Loading';

const COLORS = [
  '#1DB954','#6366f1','#ec4899','#f59e0b','#14b8a6',
  '#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316',
];

export default function TopArtists() {
  const [range, setRange] = useState('30d');

  const { data: artists, loading } = useAsync(
    useCallback(() => statsApi.topArtists(range, 50), [range])
  );

  const maxCount = artists?.[0]?.count || 1;

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-2xl font-bold">🎤 Top Artists</h1>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {loading ? <LoadingScreen /> : (
        <div className="card space-y-1">
          {(artists || []).map((a, i) => (
            <div key={a._id || i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-spotify-gray/50 transition-colors">
              <span className="text-spotify-lightgray text-sm w-6 text-right shrink-0">{i + 1}</span>

              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}40, ${COLORS[(i + 3) % COLORS.length]}40)` }}
              >
                {a.artistName?.[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{a.artistName}</p>
                <p className="text-sm text-spotify-lightgray">
                  {a.uniqueTracks} unique tracks · {formatDuration(a.totalMs)}
                </p>
                {a.genres?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {a.genres.slice(0, 3).map(g => (
                      <span key={g} className="text-xs bg-spotify-gray px-2 py-0.5 rounded-full text-spotify-lightgray">
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-1.5 h-1 bg-spotify-gray rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(a.count / maxCount) * 100}%`,
                      background: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{a.count}×</p>
                <p className="text-xs text-spotify-lightgray">gespielt</p>
              </div>
            </div>
          ))}
          {(!artists || artists.length === 0) && (
            <p className="text-spotify-lightgray text-sm text-center py-12">
              Keine Daten für diesen Zeitraum.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
