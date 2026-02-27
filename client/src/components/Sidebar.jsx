// Sidebar navigation
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/history', icon: '📋', label: 'Verlauf' },
  { to: '/top-tracks', icon: '🎵', label: 'Top Tracks' },
  { to: '/top-artists', icon: '🎤', label: 'Top Artists' },
  { to: '/top-albums', icon: '💿', label: 'Top Alben' },
  { to: '/genres', icon: '🎸', label: 'Genres' },
  { to: '/settings', icon: '⚙', label: 'Einstellungen' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 shrink-0 bg-black h-screen sticky top-0 flex flex-col p-4 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center text-black font-bold text-sm">M</div>
        <span className="font-bold text-lg tracking-tight">MySpotify</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-spotify-gray text-white'
                  : 'text-spotify-lightgray hover:text-white hover:bg-spotify-darkgray'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div className="border-t border-spotify-gray pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-spotify-green flex items-center justify-center text-black font-bold text-xs">
                {user.displayName?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName}</p>
              {user.isAdmin && <p className="text-xs text-spotify-green">Admin</p>}
            </div>
          </div>
          <button onClick={logout} className="btn-ghost w-full text-left text-xs">
            Abmelden
          </button>
        </div>
      )}
    </aside>
  );
}
