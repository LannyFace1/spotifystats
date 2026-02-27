// Top Albums page
import { useState, useCallback } from 'react';
import { statsApi } from '../services/api';
import { useAsync, formatDuration } from '../hooks/useAsync';
import RangeSelector from '../components/RangeSelector';
import { LoadingScreen } from '../components/Loading';

export default function TopAlbums() {
  const [range, setRange] = useState('30d');
  const { data: albums, loading } = useAsync(
    useCallback(() => statsApi.topAlbums(range, 50), [range])
  );
  const maxCount = albums?.[0]?.count || 1;

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-2xl font-bold">💿 Top Alben</h1>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {loading ? <LoadingScreen /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(albums || []).map((a, i) => (
            <div key={a._id || i} className="card-hover group">
              <div className="relative mb-3">
                {a.albumImage ? (
                  <img src={a.albumImage} alt={a.albumName} className="w-full aspect-square object-cover rounded-lg shadow-lg" />
                ) : (
                  <div className="w-full aspect-square bg-spotify-gray rounded-lg flex items-center justify-center text-4xl">💿</div>
                )}
                <div className="absolute top-2 left-2 bg-black/70 text-xs font-bold px-2 py-1 rounded">
                  #{i + 1}
                </div>
                <div className="absolute bottom-2 right-2 bg-spotify-green text-black text-xs font-bold px-2 py-1 rounded-full">
                  {a.count}×
                </div>
              </div>
              <p className="font-medium text-sm truncate">{a.albumName}</p>
              <p className="text-xs text-spotify-lightgray truncate">{a.artistName}</p>
              <p className="text-xs text-spotify-lightgray mt-1">
                {a.uniqueTracks} tracks · {formatDuration(a.totalMs)}
              </p>
            </div>
          ))}
          {(!albums || albums.length === 0) && (
            <div className="col-span-full text-center py-12 text-spotify-lightgray text-sm">
              Keine Daten für diesen Zeitraum.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
