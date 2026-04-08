# Sample Tracking Application - Architecture Documentation

## Overview

Sample Tracking is a role-based web application for managing product lots, quality analyses, shipments, and customer feedback. It features a Python Flask-like HTTP server backend with a vanilla JavaScript frontend and SQLite database.

**Stack:**
- **Backend:** Python 3.12 (BaseHTTPRequestHandler, no external dependencies)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Database:** SQLite3
- **Containerization:** Docker
- **Deployment:** Render.com (with persistent storage)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  (HTML/CSS/JavaScript in /docs or /v2/static)          │
├─────────────────────────────────────────────────────────┤
│                    HTTP Server Layer                     │
│  (Python BaseHTTPRequestHandler, port 8000/8010)        │
├─────────────────────────────────────────────────────────┤
│                   Authentication Layer                   │
│  (Token-based sessions, role-based access control)      │
├─────────────────────────────────────────────────────────┤
│                      API Layer                          │
│  (RESTful endpoints for LOTS, ANALYSES, DISPATCHES)     │
├─────────────────────────────────────────────────────────┤
│                    Data Layer                           │
│  (SQLite3 with foreign key constraints)                 │
└─────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Backend Server (`server.py`)

**Port:** 8000 (v1) or 8010 (v2)

**Key Components:**

- **AppHandler Class:** HTTP request handler extending BaseHTTPRequestHandler
  - `do_GET()` - Static files + authenticated API endpoints
  - `do_POST()` - Login, create resources
  - `do_PATCH()` - Update resources (dispatch status)
  - `do_OPTIONS()` - CORS preflight
  - `do_HEAD()` - Head requests for static files

- **Authentication:** Token-based (X-Auth-Token header)
  - Session dictionary: `SESSIONS[token] = {username, name, role}`
  - Default demo users with hardcoded credentials

- **Authorization:** Role-based access control
  - **Admin:** Full access
  - **Quality:** Quality lot management
  - **Logistics:** Inventory & shipment management
  - **Marketing:** Feedback & customer ratings

- **CORS Support:** Configurable via environment variable
  - `CORS_ALLOW_ORIGINS=*` (allow all)
  - `CORS_ALLOW_ORIGINS=https://domain.com` (specific origin)

### 2. Frontend

**Version 1 (`/docs`)**
- Traditional multi-page app
- Separate login.html and index.html
- Uses config.js for API endpoint configuration

**Version 2 (`/v2/static`)**
- Single-page app approach
- Integrated login flow
- Simplified configuration

**Features:**
- Session management (token storage in localStorage)
- Dashboard with role-based views
- Form submissions for creating/updating records
- Table/card layout responsive design
- Status badges with color coding

### 3. Database Layer

**Location:** `sample_tracking.db` (local) or `/var/data/sample_tracking.db` (Render)

**Schema:** Four core tables with one-to-many relationships

- `lots` - Product batches (parent entity)
- `analyses` - Quality test results (child of lots)
- `dispatches` - Shipments (child of lots)
- `feedback` - Customer feedback (child of dispatches)

### 4. Deployment Configuration

**Docker:**
- Minimal Python 3.12 slim image
- Single container running server.py
- Exposes port 8000

**Render.yaml:**
- Free tier web service
- 1GB persistent disk at `/var/data/`
- SQLite database stored on persistent disk
- Auto-deploys on Git push

---

## Data Flow

### Authentication Flow
```
User Login Form → POST /api/login → Validate Credentials → Generate Token
↓
Return Token + User Info → Store in localStorage → Include in X-Auth-Token Header
```

### CRUD Flow
```
Frontend Form → API Request with Token → Check Authentication
↓
Check Authorization (Zone/Role) → Execute Database Operation
↓
Return JSON Response → Update Frontend State
```

### Access Control Flow
```
Request with X-Auth-Token → Session Lookup → Get User Role
↓
Check Zone Permission (quality/logistics/marketing) → Allow/Deny
↓
Zone-specific endpoint handler
```

---

## Database Schema

See [DATABASE.md](./DATABASE.md) for detailed schema documentation.

---

## API Endpoints

See [API.md](./API.md) for complete API documentation.

---

## Security Considerations

### Authentication
- **Mechanism:** Token-based (secure token URL-safe random)
- **Storage:** Server-side session dictionary
- **Validation:** X-Auth-Token header required for protected endpoints

### Authorization
- **Model:** Role-based access control (RBAC)
- **Enforcement:** `can_access(role, zone)` function
- **Zones:** quality, logistics, marketing (admin has all)

### Data Protection
- **Foreign Keys:** Enforced at database level
- **Input Validation:** Basic field presence checks
- **Output:** JSON format prevents XSS in modern browsers

### CORS
- **Configurable:** Environment-based allowlist
- **Default:** No CORS headers (same-origin only)
- **Production:** GitHub Pages origin only

### Limitations (Production Hardening Needed)
- No password hashing (demo only)
- Demo credentials in code
- No rate limiting
- No audit logging
- Session tokens persist in memory (lost on restart)

---

## Performance Characteristics

### Database
- **Connection:** SQLite with row factory for dict conversion
- **Indexing:** Primary keys only (no composite indexes)
- **Queries:** N+1 potential in dashboard with multiple LOJs
- **Transaction:** Implicit auto-commit per request

### API Response
- **Static Files:** No-store cache headers (development friendly)
- **API:** No caching directives
- **Serialization:** JSON streaming

### Scalability Limits
- Single-threaded (Python Global Interpreter Lock)
- SQLite isn't suitable for high concurrency
- Session data in memory (no distributed sessions)
- Thread pool for IO (ThreadingHTTPServer)

---

## Deployment Models

### 1. Local Development
```bash
python3 server.py
# Access http://127.0.0.1:8000
```

### 2. Docker (Local)
```bash
docker build -t sample-tracking .
docker run -p 8000:8000 -v $(pwd):/app sample-tracking
```

### 3. Render.com
- Automatic deployment via GitHub webhook
- Persistent disk for SQLite storage
- Public HTTPS endpoint
- Auto-scaling disabled (free tier)

### 4. GitHub Pages (Frontend Only)
- Static files in `/docs`
- Backend hosted elsewhere (Railway/Render/etc)
- Configure `API_BASE_URL` in `docs/config.js`

---

## Development Workflow

### Project Structure
```
NPD/
├── server.py              # V1 backend (port 8000)
├── Dockerfile            # Container definition
├── render.yaml           # Render deployment config
├── docs/                 # V1 frontend (GitHub Pages compatible)
│   ├── index.html
│   ├── login.html
│   ├── app.js
│   ├── config.js
│   └── styles.css
├── v2/                   # V2 backend (port 8010)
│   ├── server.py
│   ├── static/          # V2 frontend (SPA)
│   │   ├── app.html
│   │   ├── app.js
│   │   ├── index.html
│   │   └── styles.css
└── sample_tracking.db    # SQLite database (generated)
```

### Git Strategy
- Single main branch
- No branching strategy defined
- Automatic Render deployment on push

### Database Migrations
- Schema defined in `SCHEMA` constant
- Auto-creation on first run if DB doesn't exist
- Migration function handles legacy column renames
- No rollback strategy

---

## Monitoring & Logging

### Client-Side
- Browser console for errors
- No telemetry
- localStorage for debugging

### Server-Side
- Request logging disabled (`log_message` returns None)
- Error responses as JSON
- No structured logging

---

## Future Recommendations

1. **Security Hardening**
   - Password hashing (bcrypt/argon2)
   - JWT tokens with expiration
   - Rate limiting & DDoS protection
   - HTTPS-only enforcement

2. **Scalability**
   - PostgreSQL instead of SQLite
   - Dedicated app/database servers
   - Caching layer (Redis)
   - Load balancing

3. **Operations**
   - Structured logging (JSON)
   - APM instrumentation
   - Database backups
   - Health check endpoints

4. **Testing**
   - Unit tests for API handlers
   - Integration tests with SQLite fixtures
   - E2E tests with Selenium/Playwright
   - Load testing

5. **DevOps**
   - Environment-based configuration
   - Secrets management
   - CI/CD with automated testing
   - Staging environment

---

## Related Documentation

- [API.md](./API.md) - RESTful API endpoints
- [DATABASE.md](./DATABASE.md) - Schema documentation
- [TESTING.md](./TESTING.md) - Testing guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- README.md - Quick start guide
