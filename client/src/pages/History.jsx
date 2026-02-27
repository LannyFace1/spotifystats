// Listening history with pagination
import { useState, useCallback } from 'react';
import { historyApi } from '../services/api';
import { useAsync, formatDuration } from '../hooks/useAsync';
import { LoadingScreen } from '../components/Loading';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
}

export default function History() {
  const [page, setPage] = useState(1);

  const { data, loading } = useAsync(
    useCallback(() => historyApi.list(page, 50), [page])
  );

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📋 Hörverlauf</h1>
        {data && (
          <p className="text-spotify-lightgray text-sm">
            {data.total.toLocaleString('de-DE')} Songs gesamt
          </p>
        )}
      </div>

      {loading ? <LoadingScreen /> : (
        <>
          <div className="card space-y-0.5">
            {(data?.tracks || []).map((t, i) => (
              <div key={`${t._id}-${i}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-spotify-gray/40 transition-colors">
                {t.albumImage ? (
                  <img src={t.albumImage} alt={t.albumName} className="w-10 h-10 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-spotify-gray shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.trackName}</p>
                  <p className="text-xs text-spotify-lightgray truncate">
                    {t.artistName} · {t.albumName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-spotify-lightgray">{formatDate(t.playedAt)}</p>
                  <p className="text-xs text-spotify-lightgray">{formatDuration(t.durationMs)}</p>
                </div>
              </div>
            ))}
            {(!data?.tracks || data.tracks.length === 0) && (
              <p className="text-spotify-lightgray text-sm text-center py-12">
                Noch kein Verlauf vorhanden.
              </p>
            )}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Zurück
              </button>
              <span className="text-spotify-lightgray text-sm">
                Seite {page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Weiter →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
