// Dashboard - main overview with stats, charts, and recent history
import { useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { statsApi } from '../services/api';
import { useAsync, formatDuration, formatNumber } from '../hooks/useAsync';
import RangeSelector from '../components/RangeSelector';
import StatCard from '../components/StatCard';
import { LoadingScreen } from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function processTimeline(raw = [], range) {
  return raw.map(item => {
    const { _id, count, totalMs } = item;
    let label;
    if (_id.day) {
      label = `${_id.day}.${_id.month}.`;
    } else {
      label = `KW${_id.week}`;
    }
    return { label, count, minutes: Math.round(totalMs / 60000) };
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-spotify-gray rounded-lg px-3 py-2 shadow-xl border border-white/5">
      <p className="text-xs text-spotify-lightgray mb-1">{label}</p>
      <p className="text-sm font-semibold">{payload[0].value} Songs</p>
      {payload[1] && <p className="text-xs text-spotify-lightgray">{payload[1].value} Min.</p>}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState('30d');

  const { data: overview, loading: loadingOverview } = useAsync(
    useCallback(() => statsApi.overview(range), [range])
  );
  const { data: timeline, loading: loadingTimeline } = useAsync(
    useCallback(() => statsApi.timeline(range), [range])
  );
  const { data: topTracks } = useAsync(
    useCallback(() => statsApi.topTracks(range, 5), [range])
  );
  const { data: topArtists } = useAsync(
    useCallback(() => statsApi.topArtists(range, 5), [range])
  );
  const { data: genres } = useAsync(
    useCallback(() => statsApi.topGenres(range), [range])
  );

  const timelineData = processTimeline(timeline || []);

  const GENRE_COLORS = [
    '#1DB954', '#6366f1', '#ec4899', '#f59e0b', '#14b8a6',
    '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316',
  ];

  return (
    <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Hallo, {user?.displayName?.split(' ')[0]} 👋
          </h1>
          <p className="text-spotify-lightgray text-sm mt-0.5">Dein Musik-Überblick</p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {/* Overview stats */}
      {loadingOverview ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-spotify-gray/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Gehört" value={formatDuration(overview?.totalMs)}
            icon="⏱" accent="text-spotify-green"
          />
          <StatCard label="Songs" value={formatNumber(overview?.totalTracks)} icon="🎵" />
          <StatCard label="Unique Tracks" value={formatNumber(overview?.uniqueTracks)} icon="✨" />
          <StatCard label="Artists" value={formatNumber(overview?.uniqueArtists)} icon="🎤" />
          <StatCard label="Alben" value={formatNumber(overview?.uniqueAlbums)} icon="💿" />
        </div>
      )}

      {/* Timeline chart */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <span>📈</span> Hörverhalten über Zeit
        </h2>
        {loadingTimeline ? (
          <div className="h-48 bg-spotify-gray/30 rounded animate-pulse" />
        ) : timelineData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-spotify-lightgray text-sm">
            Noch keine Daten für diesen Zeitraum.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timelineData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1DB954" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1DB954" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
              <XAxis dataKey="label" tick={{ fill: '#b3b3b3', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#b3b3b3', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#1DB954" strokeWidth={2} fill="url(#greenGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Tracks + Artists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tracks */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <span>🎵</span> Top Tracks
          </h2>
          <div className="space-y-3">
            {(topTracks || []).map((t, i) => (
              <div key={t._id} className="flex items-center gap-3">
                <span className="text-spotify-lightgray text-sm w-4 text-right shrink-0">{i + 1}</span>
                {t.albumImage ? (
                  <img src={t.albumImage} alt={t.albumName} className="w-10 h-10 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded bg-spotify-gray shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.trackName}</p>
                  <p className="text-xs text-spotify-lightgray truncate">{t.artistName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-spotify-green">{t.count}×</p>
                  <p className="text-xs text-spotify-lightgray">{formatDuration(t.totalMs)}</p>
                </div>
              </div>
            ))}
            {(!topTracks || topTracks.length === 0) && (
              <p className="text-spotify-lightgray text-sm text-center py-4">Keine Daten</p>
            )}
          </div>
        </div>

        {/* Top Artists */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <span>🎤</span> Top Artists
          </h2>
          <div className="space-y-3">
            {(topArtists || []).map((a, i) => (
              <div key={a._id || i} className="flex items-center gap-3">
                <span className="text-spotify-lightgray text-sm w-4 text-right shrink-0">{i + 1}</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-spotify-green/30 to-purple-500/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold">{a.artistName?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.artistName}</p>
                  <p className="text-xs text-spotify-lightgray truncate">
                    {a.uniqueTracks} unique tracks
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-spotify-green">{a.count}×</p>
                  <p className="text-xs text-spotify-lightgray">{formatDuration(a.totalMs)}</p>
                </div>
              </div>
            ))}
            {(!topArtists || topArtists.length === 0) && (
              <p className="text-spotify-lightgray text-sm text-center py-4">Keine Daten</p>
            )}
          </div>
        </div>
      </div>

      {/* Genres bar chart */}
      {genres && genres.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <span>🎸</span> Top Genres
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={genres.slice(0, 12)} margin={{ top: 5, right: 5, bottom: 40, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#282828" vertical={false} />
              <XAxis
                dataKey="_id"
                tick={{ fill: '#b3b3b3', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: '#b3b3b3', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#282828', border: 'none', borderRadius: 8 }}
                labelStyle={{ color: '#fff', fontSize: 12 }}
                itemStyle={{ color: '#1DB954' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {genres.slice(0, 12).map((_, i) => (
                  <Cell key={i} fill={GENRE_COLORS[i % GENRE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
