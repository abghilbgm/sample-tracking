# Sample Tracking Console

Local rebuild of the Retool sample tracking app.

## Run

```bash
python3 server.py
```

Open:

- `http://127.0.0.1:8000/login.html`
- post-login app: `http://127.0.0.1:8000/`

Demo users (editable in `server.py`):

- `admin` / `Admin@123`
- `quality` / `Quality@123`
- `logistics` / `Logistics@123`
- `marketing` / `Marketing@123`

## Included flows

- Create and review lots
- Add lab analyses per lot
- Create shipments and update delivery status
- Log customer feedback for delivered shipments

The app uses a local SQLite database file: `sample_tracking.db`.

## GitHub Pages (frontend)

GitHub Pages can host only static files (the UI). The backend API + SQLite must
run elsewhere (Railway/Render/etc).

1. Deploy the backend (e.g. Railway) and note its public URL.
2. Edit `docs/config.js` and set `window.API_BASE_URL` to that backend origin.
3. Enable GitHub Pages for this repo:
   - Settings → Pages → **Deploy from a branch**
   - Branch: `main`
   - Folder: `/docs`
4. If the UI is on GitHub Pages and the API is on Railway, set a CORS allowlist
   in your backend environment:
   - `CORS_ALLOW_ORIGINS=https://<your-username>.github.io`
   - (or `CORS_ALLOW_ORIGINS=*` for quick demos)

## Deploy (Render)

This repo includes `render.yaml` and a `Dockerfile`.

1. In Render: New → Blueprint
2. Select this GitHub repo
3. Deploy. Render mounts a persistent disk and stores the SQLite DB at `/var/data/sample_tracking.db`.

## Demo seed data

By default, a fresh database starts empty. To seed demo data on first boot, set `SEED_DEMO_DATA=1` before running.
