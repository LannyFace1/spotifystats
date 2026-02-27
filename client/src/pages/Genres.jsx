// Genres page with pie chart and bar chart
import { useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { statsApi } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import RangeSelector from '../components/RangeSelector';
import { LoadingScreen } from '../components/Loading';

const COLORS = [
  '#1DB954','#6366f1','#ec4899','#f59e0b','#14b8a6',
  '#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316',
  '#0ea5e9','#d946ef','#fb923c','#a3e635','#34d399',
];

export default function Genres() {
  const [range, setRange] = useState('30d');
  const { data: genres, loading } = useAsync(
    useCallback(() => statsApi.topGenres(range), [range])
  );

  const top10 = (genres || []).slice(0, 10);
  const top20 = (genres || []).slice(0, 20);

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-2xl font-bold">🎸 Genres</h1>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {loading ? <LoadingScreen /> : top10.length === 0 ? (
        <div className="card text-center py-16 text-spotify-lightgray">
          Noch keine Genre-Daten. Tracks müssen erst mit Artist-Infos polled werden.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie chart */}
          <div className="card">
            <h2 className="font-semibold mb-4">Verteilung</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={top10}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={3}
                >
                  {top10.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#282828', border: 'none', borderRadius: 8 }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(val, name, props) => [val, props.payload._id]}
                />
                <Legend
                  formatter={(value, entry) => (
                    <span style={{ color: '#b3b3b3', fontSize: 12 }}>{entry.payload._id}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart top 20 */}
          <div className="card">
            <h2 className="font-semibold mb-4">Top 20 Genres</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top20} layout="vertical" margin={{ left: 60, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282828" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#b3b3b3', fontSize: 11 }} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="_id"
                  tick={{ fill: '#b3b3b3', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip
                  contentStyle={{ background: '#282828', border: 'none', borderRadius: 8 }}
                  itemStyle={{ color: '#1DB954' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {top20.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
