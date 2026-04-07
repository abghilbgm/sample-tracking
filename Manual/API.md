# Sample Tracking API Documentation

## Overview

The Sample Tracking API is a RESTful HTTP API built on Python's BaseHTTPRequestHandler. It uses token-based authentication and implements role-based access control (RBAC).

**Base URL:** `http://127.0.0.1:8000` (v1) or `http://127.0.0.1:8010` (v2)

**Authentication:** Token-based via `X-Auth-Token` header

---

## Authentication

### Login

**Endpoint:** `POST /api/login`

**Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "token": "string",
  "user": {
    "username": "string",
    "name": "string"
  },
  "role": "admin|quality|logistics|marketing",
  "access": {
    "quality": boolean,
    "logistics": boolean,
    "marketing": boolean
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid username or password"
}
```

**Demo Users:**
| Username  | Password      | Role       |
|-----------|---------------|-----------|
| admin     | Admin@123     | admin     |
| quality   | Quality@123   | quality   |
| logistics | Logistics@123 | logistics |
| marketing | Marketing@123 | marketing |

### Logout

**Endpoint:** `POST /api/logout`

**Headers:**
```
X-Auth-Token: <token>
```

**Response (200 OK):**
```json
{
  "ok": true
}
```

---

## Session

### Get Current Session

**Endpoint:** `GET /api/session`

**Headers:**
```
X-Auth-Token: <token>
```

**Response (200 OK):**
```json
{
  "user": {
    "username": "string",
    "name": "string"
  },
  "role": "admin|quality|logistics|marketing",
  "access": {
    "quality": boolean,
    "logistics": boolean,
    "marketing": boolean
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Authentication required"
}
```

---

## Dashboard

### Get Dashboard Data

**Endpoint:** `GET /api/dashboard`

**Headers:**
```
X-Auth-Token: <token>
```

**Description:** Returns role-specific data including lots, inventory, marketing metrics.

**Response (200 OK):**
```json
{
  "user": {
    "username": "string",
    "name": "string"
  },
  "role": "admin|quality|logistics|marketing",
  "access": {
    "quality": boolean,
    "logistics": boolean,
    "marketing": boolean
  },
  "metrics": {
    "totalLots": number|null,
    "openLots": number|null,
    "deliveredShipments": number|null,
    "feedbackPending": number|null
  },
  "lots": [
    {
      "id": number,
      "lot_number": "string",
      "product_name": "string",
      "initial_quantity": number,
      "unit_measure": "string",
      "project_ref": "string",
      "notes": "string",
      "status": "Draft|Active|Closed",
      "created_at": "ISO8601",
      "analysis_count": number,
      "shipment_count": number
    }
  ],
  "inventory": [
    {
      "id": number,
      "lot_number": "string",
      "product_name": "string",
      "initial_quantity": number,
      "unit_measure": "string",
      "project_ref": "string",
      "notes": "string",
      "status": "Draft|Active|Closed",
      "created_at": "ISO8601"
    }
  ],
  "marketing": [
    {
      "dispatch_id": number,
      "customer_name": "string",
      "courier_name": "string",
      "dispatch_date": "string",
      "lot_number": "string",
      "product_name": "string",
      "delivery_status": "Dispatched|In Transit|Delivered",
      "feedback_id": number|null,
      "rating": number|null,
      "action_required": boolean|null,
      "next_steps": "string|null",
      "marketing_person": "string|null"
    }
  ]
}
```

**Access Control:**
- **Quality Role:** Returns `lots` with analysis & shipment counts
- **Logistics Role:** Returns `inventory` with open lots
- **Marketing Role:** Returns `marketing` with delivered shipments & feedback
- **Admin Role:** Returns all data

---

## Lots (Quality Zone)

### Create Lot

**Endpoint:** `POST /api/lots`

**Headers:**
```
X-Auth-Token: <token>
Content-Type: application/json
```

**Authorization:** Requires `quality` zone access

**Body:**
```json
{
  "lot_number": "string",              // required, unique
  "product_name": "string",            // required
  "initial_quantity": number,          // required, >= 0
  "unit_measure": "string",            // required (kg, L, boxes, etc)
  "project_ref": "string",             // optional
  "notes": "string",                   // optional
  "status": "Draft|Active|Closed"      // optional, defaults to "Draft"
}
```

**Response (201 Created):**
```json
{
  "id": number,
  "lot_number": "string",
  "product_name": "string",
  "initial_quantity": number,
  "unit_measure": "string",
  "project_ref": "string",
  "notes": "string",
  "status": "Draft|Active|Closed",
  "created_at": "ISO8601"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Missing fields: lot_number, product_name, initial_quantity, unit_measure"
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "Quality role cannot access quality operations"
}
```

### Get Lot Analyses

**Endpoint:** `GET /api/analyses?lot_id=<id>`

**Headers:**
```
X-Auth-Token: <token>
```

**Authorization:** Requires `quality` zone access

**Query Parameters:**
| Name   | Type   | Required | Description        |
|--------|--------|----------|--------------------|
| lot_id | number | yes      | Lot ID             |

**Response (200 OK):**
```json
[
  {
    "id": number,
    "lot_id": number,
    "test_type": "string",
    "spec_value": "string",
    "result_value": "string",
    "is_pass": 0|1,
    "analyst_name": "string",
    "test_date": "YYYY-MM-DD"
  }
]
```

---

## Analyses (Quality Zone)

### Create Analysis

**Endpoint:** `POST /api/analyses`

**Headers:**
```
X-Auth-Token: <token>
Content-Type: application/json
```

**Authorization:** Requires `quality` zone access

**Body:**
```json
{
  "lot_id": number,                    // required
  "test_type": "string",               // required (e.g., "Viscosity", "pH", "Color")
  "spec_value": "string",              // required (e.g., "4.5-5.5")
  "result_value": "string",            // required (e.g., "5.1")
  "is_pass": boolean,                  // required
  "analyst_name": "string",            // optional, defaults to "Lab Team"
  "test_date": "YYYY-MM-DD"            // optional, defaults to today
}
```

**Response (201 Created):**
```json
{
  "id": number,
  "lot_id": number,
  "test_type": "string",
  "spec_value": "string",
  "result_value": "string",
  "is_pass": 0|1,
  "analyst_name": "string",
  "test_date": "YYYY-MM-DD"
}
```

---

## Dispatches (Logistics Zone)

### Create Dispatch

**Endpoint:** `POST /api/dispatches`

**Headers:**
```
X-Auth-Token: <token>
Content-Type: application/json
```

**Authorization:** Requires `logistics` zone access

**Body:**
```json
{
  "lot_id": number,                    // required
  "customer_name": "string",           // required
  "quantity_sent": number,             // required, > 0
  "courier_name": "string",            // required
  "awb_number": "string",              // required (air waybill/tracking)
  "dispatch_date": "YYYY-MM-DD"        // required
}
```

**Response (201 Created):**
```json
{
  "id": number,
  "lot_id": number,
  "customer_name": "string",
  "quantity_sent": number,
  "courier_name": "string",
  "awb_number": "string",
  "dispatch_date": "YYYY-MM-DD",
  "delivery_status": "Dispatched"
}
```

### Get Dispatches for Lot

**Endpoint:** `GET /api/dispatches?lot_id=<id>`

**Headers:**
```
X-Auth-Token: <token>
```

**Authorization:** Requires `logistics` zone access

**Query Parameters:**
| Name   | Type   | Required | Description        |
|--------|--------|----------|--------------------|
| lot_id | number | yes      | Lot ID             |

**Response (200 OK):**
```json
[
  {
    "id": number,
    "lot_id": number,
    "customer_name": "string",
    "quantity_sent": number,
    "courier_name": "string",
    "awb_number": "string",
    "dispatch_date": "YYYY-MM-DD",
    "delivery_status": "Dispatched|In Transit|Delivered"
  }
]
```

### Update Dispatch Status

**Endpoint:** `PATCH /api/dispatch-status`

**Headers:**
```
X-Auth-Token: <token>
Content-Type: application/json
```

**Authorization:** Requires `logistics` zone access

**Body:**
```json
{
  "dispatch_id": number,               // required
  "delivery_status": "string"          // required (Dispatched, In Transit, Delivered)
}
```

**Response (200 OK):**
```json
{
  "id": number,
  "lot_id": number,
  "customer_name": "string",
  "quantity_sent": number,
  "courier_name": "string",
  "awb_number": "string",
  "dispatch_date": "YYYY-MM-DD",
  "delivery_status": "Dispatched|In Transit|Delivered"
}
```

---

## Feedback (Marketing Zone)

### Create Feedback

**Endpoint:** `POST /api/feedback`

**Headers:**
```
X-Auth-Token: <token>
Content-Type: application/json
```

**Authorization:** Requires `marketing` zone access

**Body:**
```json
{
  "dispatch_id": number,               // required
  "rating": number,                    // required (0-5)
  "technical_notes": "string",         // required
  "action_required": boolean,          // required
  "next_steps": "string",              // optional
  "marketing_person": "string",        // required
  "feedback_date": "YYYY-MM-DD"        // optional, defaults to today
}
```

**Response (201 Created):**
```json
{
  "id": number,
  "dispatch_id": number,
  "rating": number,
  "technical_notes": "string",
  "action_required": 0|1,
  "next_steps": "string",
  "marketing_person": "string",
  "feedback_date": "YYYY-MM-DD"
}
```

### Get Feedback for Dispatch

**Endpoint:** `GET /api/feedback?dispatch_id=<id>`

**Headers:**
```
X-Auth-Token: <token>
```

**Authorization:** Requires `marketing` zone access

**Query Parameters:**
| Name        | Type   | Required | Description            |
|-------------|--------|----------|------------------------|
| dispatch_id | number | yes      | Dispatch ID            |

**Response (200 OK):**
```json
{
  "id": number,
  "dispatch_id": number,
  "rating": number,
  "technical_notes": "string",
  "action_required": 0|1,
  "next_steps": "string",
  "marketing_person": "string",
  "feedback_date": "YYYY-MM-DD"
}
```

Or empty object `{}` if no feedback exists.

---

## Static Files

### Serve Static Content

**Endpoint:** `GET /<path>`

**Description:** Serves HTML, CSS, JavaScript, and JSON files from the `docs/` or `v2/static/` directory.

**Special Routing:**
- `GET /` → serves `index.html`
- `GET /login.html` → serves `login.html`
- `GET /app.js` → serves `app.js`
- Any path with parent directory traversal (`../`) → 403 Forbidden

**Response Headers:**
- `Content-Type`: Based on file extension
- `Cache-Control`: `no-store` for HTML/CSS/JS (development)
- `Content-Length`: File size

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid JSON payload"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "{Role} role cannot access {zone} operations"
}
```

### 404 Not Found
```json
{
  "error": "Not Found"
}
```

Or standard HTTP 404 page for missing static files.

---

## CORS Headers

Added automatically if `CORS_ALLOW_ORIGINS` environment variable is set:

**Example (with CORS enabled for GitHub Pages):**
```
Access-Control-Allow-Origin: https://username.github.io
Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Auth-Token
Access-Control-Max-Age: 600
Vary: Origin
```

---

## Rate Limiting

**Current:** No rate limiting implemented

**Recommended for Production:** Implement per-IP/token rate limiting to prevent abuse.

---

## Pagination

**Current:** Not implemented (all results returned)

**Recommended for Production:** Implement cursor-based or offset-based pagination for large datasets.

---

## Field Constraints

### Lot
- `lot_number`: TEXT, UNIQUE, NOT NULL
- `product_name`: TEXT, NOT NULL
- `initial_quantity`: REAL, >= 0
- `unit_measure`: TEXT, NOT NULL
- `status`: One of "Draft", "Active", "Closed", defaults to "Draft"

### Analysis
- `test_type`: TEXT, NOT NULL
- `spec_value`: TEXT (store spec as string for flexibility)
- `result_value`: TEXT (store result as string for flexibility)
- `is_pass`: INTEGER (0 or 1)
- `rating`: Not applicable

### Dispatch
- `quantity_sent`: REAL, > 0
- `delivery_status`: One of "Dispatched", "In Transit", "Delivered"

### Feedback
- `rating`: REAL, 0-5
- `action_required`: INTEGER (0 or 1)

---

## Client Libraries

### JavaScript (Vanilla)

```javascript
const API_BASE_URL = "http://127.0.0.1:8000";
const token = localStorage.getItem("token");

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Auth-Token": token } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }
  return response.json();
}

// Login
const { token } = await api("/api/login", {
  method: "POST",
  body: JSON.stringify({ username: "admin", password: "Admin@123" }),
});

// Get session
const session = await api("/api/session");

// Create lot
const lot = await api("/api/lots", {
  method: "POST",
  body: JSON.stringify({
    lot_number: "LOT-001",
    product_name: "Widget A",
    initial_quantity: 100,
    unit_measure: "boxes",
  }),
});
```

### Python

```python
import requests

API_BASE_URL = "http://127.0.0.1:8000"

# Login
response = requests.post(
    f"{API_BASE_URL}/api/login",
    json={"username": "admin", "password": "Admin@123"}
)
token = response.json()["token"]

# Get session
session = requests.get(
    f"{API_BASE_URL}/api/session",
    headers={"X-Auth-Token": token}
).json()

# Create lot
lot = requests.post(
    f"{API_BASE_URL}/api/lots",
    headers={"X-Auth-Token": token},
    json={
        "lot_number": "LOT-001",
        "product_name": "Widget A",
        "initial_quantity": 100,
        "unit_measure": "boxes"
    }
).json()
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [DATABASE.md](./DATABASE.md) - Database schema
- [TESTING.md](./TESTING.md) - Testing guide
- README.md - Quick start guide
