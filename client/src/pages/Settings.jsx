// Settings page
import { useState, useCallback } from 'react';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import { Spinner } from '../components/Loading';

const TIMEZONES = [
  'UTC', 'Europe/Berlin', 'Europe/Vienna', 'Europe/London',
  'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo',
];

export default function Settings() {
  const { user, setUser } = useAuth();
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');

  const { data: globalSettings } = useAsync(
    useCallback(() => userApi.globalSettings(), [])
  );
  const { data: allUsers, refetch: refetchUsers } = useAsync(
    useCallback(() => user?.isAdmin ? userApi.allUsers() : Promise.resolve([]), [user?.isAdmin])
  );

  const [regOpen, setRegOpen] = useState(null);
  // Sync regOpen from fetched data
  if (globalSettings && regOpen === null) {
    setRegOpen(globalSettings.registrationsOpen);
  }

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updated = await userApi.updateSettings({ timezone });
      setUser(u => ({ ...u, ...updated }));
      setMsg('Gespeichert!');
      setTimeout(() => setMsg(''), 2000);
    } finally {
      setSaving(false);
    }
  };

  const resync = async () => {
    setSyncing(true);
    try {
      await userApi.resync();
      setMsg('Resync abgeschlossen!');
      setTimeout(() => setMsg(''), 2000);
    } finally {
      setSyncing(false);
    }
  };

  const toggleReg = async () => {
    const newVal = !regOpen;
    setRegOpen(newVal);
    await userApi.toggleRegistrations(newVal);
  };

  const deleteUser = async (userId, name) => {
    if (!window.confirm(`"${name}" und alle Daten wirklich löschen?`)) return;
    await userApi.deleteUser(userId);
    refetchUsers();
  };

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6">⚙ Einstellungen</h1>

      {msg && (
        <div className="bg-spotify-green/10 border border-spotify-green/20 text-spotify-green text-sm rounded-xl px-4 py-3 mb-4">
          {msg}
        </div>
      )}

      {/* Profile */}
      <div className="card mb-4">
        <h2 className="font-semibold mb-4">Profil</h2>
        <div className="flex items-center gap-4 mb-4">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-spotify-green flex items-center justify-center text-black font-bold text-xl">
              {user?.displayName?.[0]}
            </div>
          )}
          <div>
            <p className="font-semibold">{user?.displayName}</p>
            <p className="text-sm text-spotify-lightgray">{user?.email}</p>
            {user?.isAdmin && <span className="text-xs bg-spotify-green/20 text-spotify-green px-2 py-0.5 rounded-full">Admin</span>}
          </div>
        </div>

        <label className="block mb-2">
          <span className="text-sm text-spotify-lightgray">Zeitzone</span>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="mt-1 block w-full bg-spotify-gray border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-spotify-green"
          >
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </label>

        <button onClick={saveSettings} disabled={saving} className="btn-primary mt-3 flex items-center gap-2">
          {saving && <Spinner size="sm" />}
          Speichern
        </button>
      </div>

      {/* Sync */}
      <div className="card mb-4">
        <h2 className="font-semibold mb-2">Synchronisation</h2>
        <p className="text-sm text-spotify-lightgray mb-4">
          Spotify wird alle 3 Minuten automatisch polled. Du kannst auch manuell triggern.
        </p>
        {user?.lastPolledAt && (
          <p className="text-xs text-spotify-lightgray mb-3">
            Letzter Sync: {new Date(user.lastPolledAt).toLocaleString('de-DE')}
          </p>
        )}
        <button onClick={resync} disabled={syncing} className="btn-primary flex items-center gap-2">
          {syncing && <Spinner size="sm" />}
          Jetzt synchronisieren
        </button>
      </div>

      {/* Admin */}
      {user?.isAdmin && (
        <div className="card">
          <h2 className="font-semibold mb-4">Admin</h2>

          {/* Registrations toggle */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium">Neue Registrierungen</p>
              <p className="text-xs text-spotify-lightgray mt-0.5">
                Erlaubt neuen Benutzern, sich anzumelden
              </p>
            </div>
            <button
              onClick={toggleReg}
              className={`relative w-12 h-6 rounded-full transition-colors ${regOpen ? 'bg-spotify-green' : 'bg-spotify-gray'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${regOpen ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Users list */}
          <div>
            <p className="text-sm font-medium mb-3">Benutzer ({allUsers?.length || 0})</p>
            <div className="space-y-2">
              {(allUsers || []).map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-spotify-black rounded-lg">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.displayName} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-spotify-green flex items-center justify-center text-black text-xs font-bold">
                      {u.displayName?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.displayName}</p>
                    <p className="text-xs text-spotify-lightgray">{u.email}</p>
                  </div>
                  {u.isAdmin && (
                    <span className="text-xs text-spotify-green">Admin</span>
                  )}
                  {u.id !== user?.id && (
                    <button
                      onClick={() => deleteUser(u.id, u.displayName)}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 hover:bg-red-400/10 rounded"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
