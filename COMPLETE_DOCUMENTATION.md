# Sample Tracking Application - Complete Documentation

**A guide covering everything you need to know about the Sample Tracking application.**

---

## Table of Contents

- [Quick Start (5 minutes)](#quick-start)
- [What Is This Application?](#what-is-this)
- [System Architecture](#system-architecture)
- [User Roles & Permissions](#user-roles)
- [Main Workflows](#main-workflows)
- [REST API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Running Locally](#running-locally)
- [Deployment Options](#deployment)
- [Testing Guide](#testing)
- [Code Standards](#standards)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Python 3.12+

### Run Locally
```bash
cd /Users/gowtham/Downloads/ABG_HILBGM/NPD
python3 server.py
```

### Access the Application
- **URL:** http://127.0.0.1:8000
- **Login page:** http://127.0.0.1:8000/login.html
- **Access URL:** https://abghilbgm.github.io/sample-tracking/

### Demo Credentials
```
Username: admin        Password: Admin@123
Username: quality      Password: Quality@123
Username: logistics    Password: Logistics@123
Username: marketing    Password: Marketing@123
```

### First Steps
1. Login with admin credentials
2. Create a product lot (name, quantity, unit)
3. Add quality test results
4. Create a shipment
5. Update delivery status
6. Add customer feedback

---

## What Is This Application?

**Sample Tracking** is a role-based web application for managing:
- **Product Lots** - Track batches from creation to delivery
- **Quality Analyses** - Record lab test results
- **Shipments** - Manage customer deliveries
- **Feedback** - Collect post-delivery ratings

### Key Features
- **Role-based access control** - Different views for different teams
- **Multi-user support** - Token-based authentication
- **Persistent storage** - SQLite database
- **Responsive design** - Works on desktop and mobile
- **No external dependencies** - Pure Python backend, vanilla JavaScript frontend

### Technology Stack
- **Backend:** Python 3.12 (BaseHTTPRequestHandler)
- **Frontend:** JavaScript, HTML5, CSS3
- **Database:** SQLite3
- **Container:** Docker (included)
- **Deployment:** Render.com, AWS, Kubernetes, or local

---

## System Architecture

### Architecture Diagram
```
┌─────────────────────────────────────────────────────┐
│         Frontend Layer (JavaScript/HTML)            │
│     - Login UI                                      │
│     - Dashboard (role-specific)                     │
│     - Forms for CRUD operations                     │
└────────────────────┬────────────────────────────────┘
                     │ HTTP Requests
                     ↓
┌─────────────────────────────────────────────────────┐
│    HTTP Server (Python BaseHTTPRequestHandler)      │
│         Port 8000 (V1) or 8010 (V2)                │
├─────────────────────────────────────────────────────┤
│  Authentication Layer (Token-based)                 │
│  - Login validation                                 │
│  - Session management                              │
├─────────────────────────────────────────────────────┤
│  Authorization Layer (Role-based)                   │
│  - RBAC enforcement                                 │
│  - Zone-based access control                        │
├─────────────────────────────────────────────────────┤
│  API Handlers                                       │
│  - /api/lots, /api/analyses                         │
│  - /api/dispatches, /api/feedback                   │
├─────────────────────────────────────────────────────┤
│  Database Layer (SQLite3)                           │
│  - Foreign key constraints                          │
│  - Cascade deletes                                  │
└─────────────────────────────────────────────────────┘
```

### Data Flow

**Authentication Flow:**
```
User Form → POST /api/login → Validate → Generate Token
↓
Return Token → Store in localStorage → Include in X-Auth-Token header
↓
Protected endpoints receive token → Validate → Grant access
```

**CRUD Flow:**
```
Frontend Form → HTTP Request → Check Authentication
↓
Check Authorization (Role/Zone) → Execute DB Query
↓
Return JSON Response → Update Frontend State
```

### Components

**Backend (server.py):**
- `AppHandler` - HTTP request handler
- `USERS` - Demo credentials
- `SESSIONS` - Active tokens and user data
- Database connection management
- API endpoint handlers

**Frontend (docs/ or v2/static/):**
- `app.js` - Main application logic
- `config.js` - API endpoint configuration
- `index.html` - Application shell
- `login.html` - Login page
- `styles.css` - Styling

**Database (sample_tracking.db):**
- `lots` - Product batches
- `analyses` - Quality test results
- `dispatches` - Shipments
- `feedback` - Customer feedback

---

## User Roles & Permissions

### Role Hierarchy

| Role | Quality | Logistics | Marketing | Can Access |
|------|---------|-----------|-----------|-----------|
| Admin | ✓ | ✓ | ✓ | Everything |
| Quality | ✓ | ✗ | ✗ | Lots, Analyses |
| Logistics | ✗ | ✓ | ✗ | Inventory, Dispatches |
| Marketing | ✗ | ✗ | ✓ | Delivered Shipments, Feedback |

### Demo Users
```
Admin          → admin / Admin@123
Quality Team   → quality / Quality@123
Logistics Team → logistics / Logistics@123
Marketing Team → marketing / Marketing@123
```

### Zone-Based Access Control

Each role has access to specific zones (functional areas):
- **quality zone** - Create lots, add analyses
- **logistics zone** - Manage inventory, create/update shipments
- **marketing zone** - Collect customer feedback

---

## Main Workflows

### Workflow 1: Quality Testing (Quality Team)

1. **Login** as quality user
2. **Navigate** to Quality Dashboard
3. **Create Lot**
   - Lot number (unique identifier)
   - Product name
   - Initial quantity
   - Unit of measurement
4. **Add Analyses**
   - Test type (Viscosity, pH, etc.)
   - Specification range
   - Actual result
   - Pass/Fail designation
5. **View Results** - See all tests for the lot

**Timeline:** 5-10 minutes per lot

### Workflow 2: Shipment Management (Logistics Team)

1. **Login** as logistics user
2. **View Inventory** - See available lots
3. **Create Dispatch**
   - Select lot to ship
   - Enter customer name
   - Set quantity to send
   - Choose courier
   - Add tracking number (AWB)
4. **Track Shipment**
   - Update status: Dispatched → In Transit → Delivered
5. **Monitor** - See all shipments on dashboard

**Timeline:** 3-5 minutes per shipment

### Workflow 3: Customer Feedback (Marketing Team)

1. **Login** as marketing user
2. **View Dashboard** - See delivered shipments
3. **Add Feedback** (once delivered)
   - Enter rating (0-5 stars)
   - Add technical notes
   - Mark if action required
   - Suggest next steps
4. **Track Metrics** - See feedback summary

**Timeline:** 2-3 minutes per feedback

### Complete End-to-End Workflow

```
Quality Team        Logistics Team       Marketing Team
┌────────┐         ┌────────┐           ┌────────┐
│ Create │         │ Create │           │  Add   │
│  Lot   │────────→│Dispatch│──────────→│Feedback│
└────────┘         └────────┘           └────────┘
    ↓                  ↓                     ↓
Add Analysis       Update Status          Record
Test Results       (In Transit)            Rating
                       ↓
                   Update Status
                   (Delivered)
```

---

## API Reference

### Authentication

#### Login
**POST /api/login**
```json
Request:
{
  "username": "admin",
  "password": "Admin@123"
}

Response (200 OK):
{
  "token": "secure-token-string",
  "user": {
    "username": "admin",
    "name": "Admin User"
  },
  "role": "admin",
  "access": {
    "quality": true,
    "logistics": true,
    "marketing": true
  }
}

Error (401):
{
  "error": "Invalid username or password"
}
```

#### Logout
**POST /api/logout**
```
Headers: X-Auth-Token: <token>

Response (200 OK):
{
  "ok": true
}
```

### Session & Dashboard

#### Get Session Info
**GET /api/session**
```
Headers: X-Auth-Token: <token>

Response (200 OK):
{
  "user": {"username": "admin", "name": "Admin User"},
  "role": "admin",
  "access": {"quality": true, "logistics": true, "marketing": true}
}
```

#### Get Dashboard
**GET /api/dashboard**
```
Headers: X-Auth-Token: <token>

Response (200 OK):
{
  "user": {...},
  "role": "admin",
  "metrics": {
    "totalLots": 25,
    "openLots": 15,
    "deliveredShipments": 50,
    "feedbackPending": 5
  },
  "lots": [...],          // For quality role
  "inventory": [...],     // For logistics role
  "marketing": [...]      // For marketing role
}
```

### Quality Zone APIs

#### Create Lot
**POST /api/lots**
```json
Request:
{
  "lot_number": "LOT-2025-001",
  "product_name": "Premium Widget A",
  "initial_quantity": 100,
  "unit_measure": "boxes",
  "project_ref": "PROJECT-123",
  "notes": "Special batch for Q1",
  "status": "Draft"
}

Response (201 Created):
{
  "id": 1,
  "lot_number": "LOT-2025-001",
  "product_name": "Premium Widget A",
  "initial_quantity": 100,
  "unit_measure": "boxes",
  "project_ref": "PROJECT-123",
  "notes": "Special batch for Q1",
  "status": "Draft",
  "created_at": "2025-04-06T14:30:00Z"
}
```

#### Get Lot Analyses
**GET /api/analyses?lot_id=1**
```
Headers: X-Auth-Token: <token>

Response (200 OK):
[
  {
    "id": 1,
    "lot_id": 1,
    "test_type": "Viscosity",
    "spec_value": "4.5-5.5",
    "result_value": "5.1",
    "is_pass": 1,
    "analyst_name": "John Doe",
    "test_date": "2025-04-06"
  }
]
```

#### Create Analysis
**POST /api/analyses**
```json
Request:
{
  "lot_id": 1,
  "test_type": "Viscosity",
  "spec_value": "4.5-5.5",
  "result_value": "5.1",
  "is_pass": true,
  "analyst_name": "John Doe",
  "test_date": "2025-04-06"
}

Response (201 Created):
{
  "id": 1,
  "lot_id": 1,
  "test_type": "Viscosity",
  "spec_value": "4.5-5.5",
  "result_value": "5.1",
  "is_pass": 1,
  "analyst_name": "John Doe",
  "test_date": "2025-04-06"
}
```

### Logistics Zone APIs

#### Create Dispatch
**POST /api/dispatches**
```json
Request:
{
  "lot_id": 1,
  "customer_name": "Customer ABC Ltd",
  "quantity_sent": 50,
  "courier_name": "FedEx",
  "awb_number": "FDX123456789",
  "dispatch_date": "2025-04-06"
}

Response (201 Created):
{
  "id": 1,
  "lot_id": 1,
  "customer_name": "Customer ABC Ltd",
  "quantity_sent": 50,
  "courier_name": "FedEx",
  "awb_number": "FDX123456789",
  "dispatch_date": "2025-04-06",
  "delivery_status": "Dispatched"
}
```

#### Get Dispatches
**GET /api/dispatches?lot_id=1**
```
Response includes all shipments for the lot.
```

#### Update Dispatch Status
**PATCH /api/dispatch-status**
```json
Request:
{
  "dispatch_id": 1,
  "delivery_status": "Delivered"
}

Response (200 OK):
{
  "id": 1,
  "lot_id": 1,
  "delivery_status": "Delivered",
  ...
}
```

### Marketing Zone APIs

#### Create Feedback
**POST /api/feedback**
```json
Request:
{
  "dispatch_id": 1,
  "rating": 4.5,
  "technical_notes": "Product quality excellent, delivery on time",
  "action_required": false,
  "next_steps": "Continue with current supplier",
  "marketing_person": "Sarah Smith",
  "feedback_date": "2025-04-07"
}

Response (201 Created):
{
  "id": 1,
  "dispatch_id": 1,
  "rating": 4.5,
  "technical_notes": "Product quality excellent...",
  "action_required": 0,
  "next_steps": "Continue with current supplier",
  "marketing_person": "Sarah Smith",
  "feedback_date": "2025-04-07"
}
```

#### Get Feedback
**GET /api/feedback?dispatch_id=1**
```
Response returns feedback for dispatch, or empty object if none.
```

### Error Responses

**400 Bad Request**
```json
{
  "error": "Missing fields: lot_number, product_name"
}
```

**401 Unauthorized**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "error": "Quality role cannot access logistics operations"
}
```

**404 Not Found**
```json
{
  "error": "Not Found"
}
```

---

## Database Schema

### Overview

SQLite3 database with 4 main tables related hierarchically:

```
lots (parent)
├── analyses (N:1 relationship)
└── dispatches (N:1 relationship)
    └── feedback (1:1 relationship)
```

### Table: lots
**Root entity representing a product batch.**

```sql
CREATE TABLE lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_number TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  initial_quantity REAL NOT NULL CHECK(initial_quantity >= 0),
  unit_measure TEXT NOT NULL,
  project_ref TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Unique identifier |
| lot_number | TEXT | UNIQUE, NOT NULL | External identifier (e.g., "LOT-2025-001") |
| product_name | TEXT | NOT NULL | Product name |
| initial_quantity | REAL | >= 0 | Quantity created |
| unit_measure | TEXT | NOT NULL | Unit (kg, boxes, liters, etc.) |
| project_ref | TEXT | DEFAULT '' | Project reference |
| notes | TEXT | DEFAULT '' | Free-form notes |
| status | TEXT | DEFAULT 'Draft' | Status: Draft, Active, or Closed |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### Table: analyses
**Quality test results tied to a lot.**

```sql
CREATE TABLE analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_id INTEGER NOT NULL,
  test_type TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  result_value TEXT NOT NULL,
  is_pass INTEGER NOT NULL DEFAULT 0,
  analyst_name TEXT NOT NULL,
  test_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE
);
```

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Test result identifier |
| lot_id | INTEGER | Reference to lot (CASCADE on delete) |
| test_type | TEXT | Type of test (Viscosity, pH, Color, etc.) |
| spec_value | TEXT | Specification (e.g., "6.8-7.2") |
| result_value | TEXT | Actual result (e.g., "7.0") |
| is_pass | INTEGER | 0 = fail, 1 = pass |
| analyst_name | TEXT | Person who performed test |
| test_date | TEXT | Test date (YYYY-MM-DD) |

### Table: dispatches
**Shipments of lots to customers.**

```sql
CREATE TABLE dispatches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lot_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  quantity_sent REAL NOT NULL CHECK(quantity_sent > 0),
  courier_name TEXT NOT NULL,
  awb_number TEXT NOT NULL,
  dispatch_date TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'Dispatched',
  FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE
);
```

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Shipment identifier |
| lot_id | INTEGER | Reference to lot |
| customer_name | TEXT | Customer name |
| quantity_sent | REAL | Quantity shipped (> 0) |
| courier_name | TEXT | Courier name (FedEx, DHL, etc.) |
| awb_number | TEXT | Tracking number |
| dispatch_date | TEXT | Dispatch date |
| delivery_status | TEXT | Status: Dispatched, In Transit, or Delivered |

### Table: feedback
**Customer feedback post-delivery.**

```sql
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dispatch_id INTEGER NOT NULL UNIQUE,
  rating REAL NOT NULL CHECK(rating >= 0 AND rating <= 5),
  technical_notes TEXT NOT NULL,
  action_required INTEGER NOT NULL DEFAULT 0,
  next_steps TEXT DEFAULT '',
  marketing_person TEXT NOT NULL,
  feedback_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispatch_id) REFERENCES dispatches(id) ON DELETE CASCADE
);
```

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Feedback identifier |
| dispatch_id | INTEGER | Reference to dispatch (unique, one feedback per shipment) |
| rating | REAL | Rating 0-5 (e.g., 4.5) |
| technical_notes | TEXT | Feedback details |
| action_required | INTEGER | 0 = no, 1 = yes |
| next_steps | TEXT | Recommended actions |
| marketing_person | TEXT | Person who collected feedback |
| feedback_date | TEXT | Feedback date |

### Data Relationships

**Cascade Delete:**
- Delete lot → All analyses and dispatches deleted
- Delete dispatch → Associated feedback deleted
- This prevents orphaned records

**Query Example - Lots with Analysis Count:**
```sql
SELECT
  l.id,
  l.lot_number,
  l.product_name,
  COUNT(DISTINCT a.id) AS analysis_count,
  COUNT(DISTINCT d.id) AS shipment_count
FROM lots l
LEFT JOIN analyses a ON a.lot_id = l.id
LEFT JOIN dispatches d ON d.lot_id = l.id
GROUP BY l.id
ORDER BY datetime(l.created_at) DESC;
```

---

## Running Locally

### Installation

**Requirements:**
- Python 3.12+
- No external dependencies (included in Python)

### Start Server

```bash
cd /Users/gowtham/Downloads/ABG_HILBGM/NPD
python3 server.py
```

**Output:**
```
Server listening on http://127.0.0.1:8000
```

### Access Application

- **App:** http://127.0.0.1:8000
- **Login:** http://127.0.0.1:8000/login.html

### With Demo Data

```bash
export SEED_DEMO_DATA=1
python3 server.py
```

This populates the database with sample lots, analyses, shipments, and feedback.

### Key Files

- `server.py` - Backend HTTP server
- `docs/` - V1 frontend (traditional)
- `v2/` - V2 frontend (alternative)
- `sample_tracking.db` - SQLite database (created on first run)

### Database Location

```
/Users/gowtham/Downloads/ABG_HILBGM/NPD/sample_tracking.db
```

### Reset Database

```bash
rm sample_tracking.db
python3 server.py
```

---

## Deployment Options

### Option 1: Local Development
```bash
python3 server.py
# http://127.0.0.1:8000
```
**Best for:** Testing, learning, development

### Option 2: Docker Container

```bash
# Build
docker build -t sample-tracking .

# Run
docker run -p 8000:8000 \
  -v $(pwd)/data:/var/data \
  sample-tracking
```

**Best for:** Portability, consistent environments

### Option 3: Render.com (Easiest for Production)

1. Push code to GitHub
2. Go to render.com
3. Create new Web Service
4. Connect GitHub repository
5. Deploy (takes 3-5 minutes)
6. Access at `https://abghilbgm.github.io/sample-tracking/`

**Configuration:**
- Automatic Dockerfile detection
- Persistent disk for database
- Auto-deploys on git push
- Free tier: $0/month (spins down)
- Starter: $7/month (always on)

**Environment Variables:**
```
SEED_DEMO_DATA=1        # (optional, first deploy only)
CORS_ALLOW_ORIGINS=*    # (for development)
```

### Option 4: GitHub Pages + Backend

1. Backend: Deploy to Render/Railway
2. Frontend: Deploy to GitHub Pages (docs/)
3. Configure API endpoint:

```javascript
// docs/config.js
window.API_BASE_URL = "https://abghilbgm.github.io/sample-tracking/";
```

### Option 5: AWS ECS

```bash
# Build and push to ECR
aws ecr create-repository --repository-name sample-tracking
docker tag sample-tracking:latest ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/sample-tracking:latest
docker push ...

# Deploy ECS task
aws ecs create-service --cluster default \
  --service-name sample-tracking \
  --task-definition sample-tracking:1 \
  --desired-count 1 \
  --launch-type FARGATE
```

### Option 6: Kubernetes

```bash
kubectl apply -f pvc.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

See deployment.yaml for manifest examples.

### Comparison

| Platform | Cost | Setup Time | Best For |
|----------|------|-----------|----------|
| Local | $0 | 5 min | Development |
| Docker | $0 | 10 min | Testing |
| Render | $7/mo | 15 min | Small production |
| AWS | $15+/mo | 1 hour | Enterprise |
| Kubernetes | $30+/mo | 2 hours | Scale |

---

## Testing Guide

### Current State
- No automated tests implemented yet
- Manual testing recommended

### Unit Testing (Python - pytest)

```python
# test_server.py
import pytest
from server import normalize_role, can_access

def test_normalize_role_valid():
    assert normalize_role("ADMIN") == "admin"
    assert normalize_role("quality") == "quality"
    assert normalize_role(None) == "admin"

def test_admin_can_access_all_zones():
    assert can_access("admin", "quality") == True
    assert can_access("admin", "logistics") == True
    assert can_access("admin", "marketing") == True

def test_quality_role_limited():
    assert can_access("quality", "quality") == True
    assert can_access("quality", "logistics") == False
    assert can_access("quality", "marketing") == False
```

**Run tests:**
```bash
pip install pytest pytest-cov
pytest test_server.py -v
```

### Integration Testing

```python
# Test API endpoints with SQLite fixtures
def test_login_valid_credentials(test_db):
    response = client.post('/api/login', json={
        'username': 'admin',
        'password': 'Admin@123'
    })
    assert response.status_code == 200
    assert 'token' in response.json()

def test_create_lot_requires_auth(test_db):
    response = client.post('/api/lots', json={
        'lot_number': 'LOT-001',
        'product_name': 'Widget',
        'initial_quantity': 100,
        'unit_measure': 'boxes'
    })
    assert response.status_code == 401
    assert 'Authentication required' in response.json()['error']
```

### Manual Test Cases

**Test 1: Complete Workflow**
1. Login as quality user
2. Create lot "LOT-TEST-001"
3. Add analysis (pH test)
4. Logout
5. Login as logistics user
6. Create dispatch for lot
7. Update status to "Delivered"
8. Logout
9. Login as marketing user
10. Add feedback (rating 4.5)
✓ Expected: All operations succeed

**Test 2: Access Control**
1. Login as quality user
2. Try to create dispatch (should fail)
3. Try to add feedback (should fail)
✓ Expected: 403 Forbidden

**Test 3: Data Validation**
1. Try to create lot with negative quantity (should fail)
2. Try to create dispatch for non-existent lot (should fail)
✓ Expected: 400/500 errors

### E2E Testing (Playwright Example)

```javascript
import { test, expect } from '@playwright/test';

test('complete workflow', async ({ page }) => {
  // Login
  await page.goto('http://localhost:8000/login.html');
  await page.fill('[name=username]', 'quality');
  await page.fill('[name=password]', 'Quality@123');
  await page.click('button[type=submit]');
  await page.waitForURL('http://localhost:8000/');
  
  // Create lot
  await page.click('[data-action=create-lot]');
  await page.fill('[name=lot_number]', 'LOT-E2E-001');
  await page.fill('[name=product_name]', 'Test Product');
  await page.click('button[type=submit]');
  
  // Verify
  expect(await page.textContent('body')).toContain('LOT-E2E-001');
});
```

**Run:**
```bash
npm install -D @playwright/test
npx playwright test
```

### Coverage Goals
- Core logic: 80%+
- API endpoints: 85%+
- Critical paths: 100%

---

## Code Standards

### Python (Backend)

**Style Guide:** PEP 8

```python
#!/usr/bin/env python3
"""Module docstring."""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path

# Constants
CONSTANT_NAME = "value"

# Type hints
def query_all(conn: sqlite3.Connection, sql: str, params: tuple = ()) -> list[dict]:
    """
    Query multiple rows.
    
    Args:
        conn: Database connection
        sql: SQL query
        params: Query parameters
    
    Returns:
        List of row dictionaries
    """
    return [dict(row) for row in conn.execute(sql, params).fetchall()]

# Error handling
try:
    value = int(input_value)
except ValueError:
    send_error("Invalid integer", 400)
    return
```

**Naming Conventions:**
```
CONSTANTS = "UPPER_CASE"
variables = "snake_case"
ClassName = "PascalCase"
function_name = "snake_case"
_private_method = "leading_underscore"
```

### JavaScript (Frontend)

**Style Guide:** Google JavaScript Style Guide

```javascript
/**
 * Application state management
 * @type {Object}
 */
const state = {
  dashboard: null,
  token: localStorage.getItem("token") || "",
  user: null,
  role: null,
};

// Naming conventions
const CONSTANTS = "UPPER_CASE";
const variableName = "camelCase";
class ClassName {}
function functionName() {}

// Use const by default
const immutable = "value";
let mutable = "value";

// Arrow functions for callbacks
array.map((item) => item.id);

// Optional chaining & nullish coalescing
const role = user?.role?.toLowerCase() ?? "admin";
const items = data?.items ?? [];
```

### Database Naming

**Conventions:**
```sql
-- Tables: singular, lowercase
CREATE TABLE lots (...)
CREATE TABLE analyses (...)

-- Columns: snake_case
lot_number, created_at, is_active

-- Foreign keys: {table}_id
lot_id, dispatch_id

-- Timestamps: TEXT ISO8601
created_at TEXT DEFAULT CURRENT_TIMESTAMP
```

### Commit Messages

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style
- `refactor` - Code restructuring
- `test` - Test changes
- `chore` - Maintenance

**Examples:**
```
feat(api): add cascade delete support

Implement foreign key constraints with CASCADE delete
for automatic cleanup of child records.

Closes #42
```

```
fix(frontend): preserve token on page refresh

Token was cleared on page reload. Now restored from
localStorage before making API calls.

Fixes #15
```

### API Design

**RESTful Conventions:**
- `GET` - Retrieve
- `POST` - Create
- `PATCH` - Update (partial)
- `DELETE` - Remove (not implemented)

**Endpoints:**
```
/api/login              POST    - Authenticate
/api/logout             POST    - Clear session
/api/session            GET     - Current user info
/api/dashboard          GET     - Role-specific data
/api/lots               POST    - Create lot
/api/analyses           GET/POST - Quality tests
/api/dispatches         GET/POST - Shipments
/api/dispatch-status    PATCH   - Update status
/api/feedback           GET/POST - Customer feedback
```

**Response Format:**
```json
{
  "id": 1,
  "field_name": "value",
  "created_at": "2025-04-06T14:30:00Z"
}
```

**Error Format:**
```json
{
  "error": "Description of what went wrong"
}
```

---

## Troubleshooting

### Database Issues

**"Database is locked"**
- Solution: Stop server (Ctrl+C), wait 5 seconds, restart
- Root cause: SQLite file locks with concurrent access
- Production fix: Use PostgreSQL instead

**"Command not found: python3"**
- Solution: Install Python 3.12+
- Check: `python3 --version`

### Authentication Issues

**"Login always fails"**
1. Check credentials: Default is `admin / Admin@123`
2. Clear browser cookies
3. Try incognito/private mode
4. Restart server

**"Session expired / 401 error"**
- Tokens stored in localStorage
- Clear browser storage if stuck
- Logout and login again

### Deployment Issues

**"Port 8000 already in use"**
```bash
lsof -i :8000      # Find process
kill -9 <PID>      # Kill it
PORT=8001 python3 server.py  # Use different port
```

**"Cannot connect to API"**
1. Check backend is running
2. Check API_BASE_URL in config.js
3. Check CORS is configured (if cross-origin)
4. Check firewall isn't blocking port

**"CORS errors in browser"**
- Set environment variable: `CORS_ALLOW_ORIGINS=*`
- Or specific origin: `CORS_ALLOW_ORIGINS=https://yourdomain.com`
- Restart server after changing

### Data Issues

**"Data disappeared"**
1. Check database file exists: `ls -la sample_tracking.db`
2. Check file size: `du -sh sample_tracking.db`
3. Try backup: `cp sample_tracking.db.backup sample_tracking.db`
4. If no backup, data is lost

**"Database file is huge"**
1. Check record count: Query and analyze
2. Archive old data
3. Consider data cleanup cron job
4. Add database indexes for performance

### Performance Issues

**"Application is slow"**
1. Check database size: `du -sh sample_tracking.db`
2. Check if lots of concurrent users
3. Add database indexes (see DATABASE.md)
4. Upgrade to PostgreSQL for production

**"Memory leaks"**
1. Check processes: `ps aux | grep python`
2. Monitor with: `top` or `Activity Monitor`
3. Restart server if leaking
4. Profile with: `python3 -m cProfile server.py`

---

## Quick Reference

### URLs
- Main app: `http://127.0.0.1:8000`
- Login page: `http://127.0.0.1:8000/login.html`
- API base: `http://127.0.0.1:8000/api`

### Demo Credentials
```
admin / Admin@123
quality / Quality@123
logistics / Logistics@123
marketing / Marketing@123
```

### File Structure
```
NPD/
├── server.py              ← Backend
├── docs/                  ← V1 Frontend
├── v2/                    ← V2 Frontend
├── sample_tracking.db     ← Database
├── Dockerfile             ← Container
└── render.yaml            ← Render config
```

### Common Commands
```bash
python3 server.py                    # Start server
rm sample_tracking.db               # Reset database
export SEED_DEMO_DATA=1             # Enable demo data
docker build -t sample-tracking .   # Build container
docker run -p 8000:8000 sample-tracking  # Run container
```

### API Examples

**Login:**
```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

**Create Lot:**
```bash
curl -X POST http://127.0.0.1:8000/api/lots \
  -H "X-Auth-Token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lot_number":"LOT-001","product_name":"Widget","initial_quantity":100,"unit_measure":"boxes"}'
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error

---

## Summary

**Sample Tracking** is a complete role-based application for managing product lots, quality testing, shipments, and customer feedback.

**To get started:**
1. Run `python3 server.py`
2. Open http://127.0.0.1:8000
3. Login with `admin / Admin@123`
4. Explore the application

**Key points:**
- No external dependencies
- Token-based authentication
- Role-based access control (RBAC)
- SQLite database
- Docker containerization included
- Deploy to Render, AWS, or Kubernetes

**Documentation includes:**
- Quick start (5 minutes)
- Complete API reference
- Database schema
- Testing guide
- Deployment options
- Code standards
- Troubleshooting guide

**Questions?** Check the relevant section above or review code examples.

---

**Version:** 1.0.0  
**Last Updated:** April 6, 2025  
**License:** Sample/Demo Application

---
