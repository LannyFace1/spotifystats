# 🎵 SpotifyStats — Self-Hosted Spotify Statistics

Ein selbst-gehostetes Spotify-Tracking-Dashboard. Verfolge was du hörst und entdecke detaillierte Statistiken über dein Musikverhalten.

![Screenshot](https://via.placeholder.com/800x400/121212/1DB954?text=MySpotify+Dashboard)

## ✨ Features

- 📊 **Dashboard** — Übersicht mit Statistiken und Timeline-Chart
- 🎵 **Top Tracks** — Deine meistgehörten Songs mit Balkendiagramm
- 🎤 **Top Artists** — Lieblingsartisten mit Genre-Tags  
- 💿 **Top Alben** — Album-Grid mit Cover-Artwork
- 🎸 **Genres** — Pie-Chart und Balkendiagramm deiner Genres
- 📋 **Hörverlauf** — Paginierte Liste aller gehörten Songs
- ⚙️ **Einstellungen** — Zeitzone, manueller Resync, Admin-Panel
- 🌙 **Dark Mode** — Modernes, dunkles Spotify-inspiriertes Design
- 🔄 **Auto-Polling** — Tracks werden alle 3 Minuten automatisch abgerufen

## 🚀 Setup

### 1. Spotify App erstellen

1. Gehe zu [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Klicke **Create app**
3. Fülle Name und Beschreibung aus
4. Setze **Redirect URI**: `http://DEINE_DOMAIN:3000/api/auth/spotify/callback`
5. Aktiviere **Web API**
6. Notiere **Client ID** und **Client Secret**

### 2. Konfiguration

```bash
git clone <repo>
cd myspotify
cp .env.example .env
```

Bearbeite `.env`:

```env
SPOTIFY_PUBLIC=deine_client_id
SPOTIFY_SECRET=dein_client_secret
API_ENDPOINT=http://localhost:3000
CLIENT_ENDPOINT=http://localhost:3000
JWT_SECRET=<generiere_mit: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
```

### 3. Starten

```bash
docker compose up -d
```

Öffne `http://localhost:3000` und melde dich mit Spotify an.

**Der erste Benutzer wird automatisch zum Admin.**

## 🔧 Erweiterte Konfiguration

### Anderer Port

```env
PORT=8080  # in .env
```

### Hinter einem Reverse Proxy (empfohlen für HTTPS)

```nginx
# Traefik oder Nginx — MySpotify auf Port 3000
proxy_pass http://localhost:3000;
```

Setze dann in `.env`:
```env
API_ENDPOINT=https://spotify.deindomain.com
CLIENT_ENDPOINT=https://spotify.deindomain.com
```

Und füge `https://spotify.deindomain.com/api/auth/spotify/callback` in dein Spotify-Dashboard als Redirect URI ein.

## 📁 Projektstruktur

```
myspotify/
├── server/                # Node.js + Express Backend
│   ├── src/
│   │   ├── index.js       # App entry point
│   │   ├── routes/        # auth, stats, history, user
│   │   ├── models/        # User, Track, Settings
│   │   ├── middleware/    # JWT auth
│   │   └── services/      # Spotify API, Poller, Logger
│   └── Dockerfile
├── client/                # React + Tailwind Frontend
│   ├── src/
│   │   ├── pages/         # Dashboard, TopTracks, History, ...
│   │   ├── components/    # Sidebar, StatCard, RangeSelector
│   │   ├── context/       # AuthContext
│   │   ├── hooks/         # useAsync
│   │   └── services/      # API client
│   └── Dockerfile
├── nginx/
│   └── default.conf       # Reverse proxy config
├── docker-compose.yml
└── .env.example
```

## 🔐 Sicherheit

- JWT-Auth (HttpOnly Cookie, 7 Tage)
- Spotify-Tokens werden nur serverseitig gespeichert
- MongoDB nicht öffentlich exponiert
- Nginx als einziger öffentlicher Eintrittspunkt
- Rate Limiting auf API-Routen
- Helmet.js Security Headers
- Non-root Docker User

## 🛠 Maintenance

```bash
# Logs ansehen
docker compose logs -f

# Update
docker compose pull && docker compose up -d --build

# Backup MongoDB
docker exec myspotify_mongo mongodump --out /tmp/backup
docker cp myspotify_mongo:/tmp/backup ./backup
```
