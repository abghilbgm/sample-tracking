// GitHub Pages hosts only the frontend (static files).
// If you are serving the UI from GitHub Pages, set this to your backend origin:
//   window.API_BASE_URL = "https://<your-railway-app>.up.railway.app";
//
// When the UI is served by `server.py` (local/dev or Railway), leave this empty
// to use same-origin requests.
// Split local mode (static frontend + python backend):
// - Frontend: `python3 -m http.server 8000 --directory docs`
// - Backend:  `CORS_ALLOW_ORIGINS=http://127.0.0.1:8000 HOST=127.0.0.1 PORT=8001 python3 server.py`
// Example for split local mode:
//   window.API_BASE_URL = "http://127.0.0.1:8001";
//
// Default:
// - GitHub Pages (`*.github.io`): use hosted backend (static frontend can't serve /api/*).
// - Everything else: same-origin (works with `python3 server.py` which serves UI + API).
(function initApiBaseUrl() {
  if (window.API_BASE_URL != null && String(window.API_BASE_URL).trim() !== "") return;
  const isGitHubPages = /github\.io$/i.test(location.hostname);
  window.API_BASE_URL = isGitHubPages
    ? ""
    : "";
})();
