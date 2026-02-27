// Top Tracks full page
import { useState, useCallback } from 'react';
import { statsApi } from '../services/api';
import { useAsync, formatDuration } from '../hooks/useAsync';
import RangeSelector from '../components/RangeSelector';
import { LoadingScreen } from '../components/Loading';

export default function TopTracks() {
  const [range, setRange] = useState('30d');

  const { data: tracks, loading } = useAsync(
    useCallback(() => statsApi.topTracks(range, 50), [range])
  );

  const maxCount = tracks?.[0]?.count || 1;

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-2xl font-bold">🎵 Top Tracks</h1>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {loading ? <LoadingScreen /> : (
        <div className="card space-y-1">
          {(tracks || []).map((t, i) => (
            <div key={t._id} className="group flex items-center gap-4 p-3 rounded-lg hover:bg-spotify-gray/50 transition-colors">
              {/* Rank */}
              <span className="text-spotify-lightgray text-sm w-6 text-right shrink-0">{i + 1}</span>

              {/* Album art */}
              {t.albumImage ? (
                <img src={t.albumImage} alt={t.albumName} className="w-12 h-12 rounded object-cover shrink-0 shadow" />
              ) : (
                <div className="w-12 h-12 rounded bg-spotify-gray shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={t.externalUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-spotify-green transition-colors truncate"
                  >
                    {t.trackName}
                  </a>
                </div>
                <p className="text-sm text-spotify-lightgray truncate">
                  {t.artistNames?.join(', ') || t.artistName} · {t.albumName}
                </p>

                {/* Bar */}
                <div className="mt-1.5 h-1 bg-spotify-gray rounded-full overflow-hidden">
                  <div
                    className="h-full bg-spotify-green rounded-full transition-all"
                    style={{ width: `${(t.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="text-right shrink-0 ml-2">
                <p className="font-bold text-spotify-green">{t.count}×</p>
                <p className="text-xs text-spotify-lightgray">{formatDuration(t.totalMs)}</p>
              </div>
            </div>
          ))}
          {(!tracks || tracks.length === 0) && (
            <p className="text-spotify-lightgray text-sm text-center py-12">
              Keine Daten für diesen Zeitraum.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
