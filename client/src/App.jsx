// Main App - routing setup
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import TopTracks from './pages/TopTracks';
import TopArtists from './pages/TopArtists';
import TopAlbums from './pages/TopAlbums';
import Genres from './pages/Genres';
import Settings from './pages/Settings';
import { LoadingScreen } from './components/Loading';

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  return <Layout />;
}

function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicOnly />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/top-tracks" element={<TopTracks />} />
            <Route path="/top-artists" element={<TopArtists />} />
            <Route path="/top-albums" element={<TopAlbums />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
