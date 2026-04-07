# Development Standards & Best Practices

## Code Quality Standards

### Python (Backend)

#### Style Guide

**Standard:** PEP 8 with modifications

```python
# Naming conventions
CONSTANTS = "UPPER_CASE"
class ClassName:
    instance_variable = "snake_case"
    def method_name(self): pass
    def _private_method(self): pass

# Line length: 120 characters

# Imports
import json
import os
from datetime import datetime
from http import HTTPStatus
from pathlib import Path
```

#### Code Structure

**File Organization:**
```python
#!/usr/bin/env python3
"""Module docstring: Brief description of file purpose."""

from __future__ import annotations

# Standard library imports
import json
import os

# Third-party imports (none currently)

# Local imports
from server import function_name

# Module constants
CONSTANT_NAME = "value"

# Helper functions
def helper_function(): pass

# Main classes
class MainClass: pass

# Entry point
if __name__ == "__main__":
    main()
```

#### Type Hints

**Use for clarity:**
```python
def query_all(connection: sqlite3.Connection, sql: str, params: tuple = ()) -> list[dict]:
    """Query multiple rows, return as list of dicts."""
    return [dict(row) for row in connection.execute(sql, params).fetchall()]

def can_access(role: str, zone: str) -> bool:
    """Check if role has access to zone."""
    permissions = {...}
    return zone in permissions.get(role, set())
```

#### Error Handling

```python
# Use try-except for expected errors
try:
    length = int(self.headers.get("Content-Length", "0"))
except ValueError:
    self.send_json({"error": "Invalid Content-Length"}, HTTPStatus.BAD_REQUEST)
    return

# Provide context in error messages
if not user:
    raise ValueError(f"User '{username}' not found in database")
```

#### Documentation

```python
def normalize_role(value: str | None) -> str:
    """
    Normalize and validate role string.
    
    Args:
        value: Role name to normalize (case-insensitive, None defaults to "admin")
    
    Returns:
        Normalized role name (lowercase)
    
    Raises:
        None (invalid roles default to "admin")
    
    Examples:
        >>> normalize_role("ADMIN")
        "admin"
        >>> normalize_role("invalid")
        "admin"
    """
    role = (value or "admin").strip().lower()
    return role if role in ROLES else "admin"
```

---

### JavaScript (Frontend)

#### Style Guide

**Standard:** Google JavaScript Style Guide

```javascript
// Naming conventions
const CONSTANTS = "UPPER_CASE";
const variableName = "camelCase";
class ClassName {}
function functionName() {}

// Line length: 100 characters

// Use const by default, let if reassigned, avoid var
const state = {...};
let selectedId = null;
```

#### Code Structure

```javascript
// File: app.js
/**
 * Sample Tracking Application
 * 
 * Provides frontend for role-based tracking system.
 * Handles authentication, API communication, UI rendering.
 */

// Module state
const state = {
  dashboard: null,
  token: localStorage.getItem("sample_tracking_token") || "",
  user: null,
  role: null,
};

// Utility functions
const $ = (selector) => document.querySelector(selector);

function resolveApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  // ... implementation
}

// API functions
async function api(path, options = {}) {
  // ... implementation
}

// DOM rendering functions
function renderTable(container, columns, rows, options = {}) {
  // ... implementation
}

// Event handlers
function handleLoginSubmit(event) {
  // ... implementation
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  initializeApp();
});
```

#### Error Handling

```javascript
// Use try-catch for async operations
async function fetchData() {
  try {
    const response = await api("/api/data");
    return response;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    showErrorMessage(error.message || "An error occurred");
  }
}

// Use optional chaining and nullish coalescing
const role = user?.role?.toLowerCase() ?? "admin";
const items = data?.items ?? [];
```

#### Documentation

```javascript
/**
 * Creates a table element from data rows.
 * 
 * @param {HTMLElement} container - DOM element to render table into
 * @param {Array<{label, key, render?}>} columns - Column definitions
 * @param {Array<Object>} rows - Data rows
 * @param {Object} options - Configuration options
 * @param {Function} options.onSelect - Row click handler
 * @param {string} options.empty - Empty state message
 * @returns {void}
 * 
 * @example
 * renderTable(
 *   document.getElementById('table'),
 *   [{label: 'Name', key: 'name'}, {label: 'Age', key: 'age'}],
 *   [{name: 'John', age: 30}],
 *   {onSelect: (id) => console.log(id)}
 * );
 */
function renderTable(container, columns, rows, options = {}) {
  // ... implementation
}
```

---

## Database Standards

### Schema Design

#### Naming Conventions

```sql
-- Tables: singular, lowercase
CREATE TABLE lots (...)
CREATE TABLE analyses (...)

-- Columns: snake_case, descriptive
user_id, created_at, is_active, delivery_status

-- Foreign keys: {table}_id
lot_id, dispatch_id, feedback_id

-- Timestamps: always use TEXT in ISO8601 with Z suffix
created_at TEXT DEFAULT CURRENT_TIMESTAMP
'2025-04-06T14:30:00Z'
```

#### Constraints

```sql
-- Always use foreign keys
FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE

-- Check constraints for validation
CHECK(initial_quantity >= 0)
CHECK(rating >= 0 AND rating <= 5)

-- UNIQUE for identifiers
UNIQUE(lot_number)

-- NOT NULL for required fields
NOT NULL

-- DEFAULT for common values
DEFAULT 'Draft'
DEFAULT 0
DEFAULT CURRENT_TIMESTAMP
```

#### Indexing Strategy

**Current:** Only primary keys (minimal schema)

**Production recommendation:**
```sql
-- Create indexes on foreign keys
CREATE INDEX idx_analyses_lot_id ON analyses(lot_id);
CREATE INDEX idx_dispatches_lot_id ON dispatches(lot_id);

-- Create indexes on frequently searched columns
CREATE INDEX idx_lots_status ON lots(status);
CREATE INDEX idx_dispatches_status ON dispatches(delivery_status);

-- Unique indexes for constraints
CREATE UNIQUE INDEX idx_feedback_dispatch_id ON feedback(dispatch_id);
```

---

## API Standards

### RESTful Conventions

**Methods:**
- `GET` - Retrieve resource(s)
- `POST` - Create new resource
- `PATCH` - Update resource (partial)
- `DELETE` - Remove resource (not implemented)

**Status Codes:**
```
200 OK              - Request successful
201 Created         - Resource created
204 No Content      - Successful with no response body
400 Bad Request     - Invalid input
401 Unauthorized    - Authentication required
403 Forbidden       - Authorization failed
404 Not Found       - Resource not found
500 Internal Error  - Server error
```

**Request Format:**
```
POST /api/lots
X-Auth-Token: <token>
Content-Type: application/json

{
  "lot_number": "string",
  "product_name": "string",
  "initial_quantity": number,
  "unit_measure": "string"
}
```

**Response Format:**
```
201 Created

{
  "id": 1,
  "lot_number": "string",
  "product_name": "string",
  "initial_quantity": number,
  "unit_measure": "string",
  "status": "Draft",
  "created_at": "ISO8601"
}
```

**Error Response:**
```
400 Bad Request

{
  "error": "Missing fields: lot_number, product_name"
}
```

### Endpoint Structure

**Pattern:** `/api/{resource}/{action}`

```
GET    /api/session               - Get current user session
GET    /api/dashboard             - Get dashboard data
GET    /api/lots                  - (not implemented)
POST   /api/lots                  - Create lot
GET    /api/analyses?lot_id=1     - Get lot analyses
POST   /api/analyses              - Create analysis
GET    /api/dispatches?lot_id=1   - Get lot dispatches
POST   /api/dispatches            - Create dispatch
PATCH  /api/dispatch-status       - Update dispatch status
GET    /api/feedback?dispatch_id=1- Get dispatch feedback
POST   /api/feedback              - Create feedback
```

### Authentication

```javascript
// Client implementation
const token = localStorage.getItem("token");
const headers = {
  "X-Auth-Token": token,
  "Content-Type": "application/json"
};

const response = await fetch("/api/dashboard", { headers });
```

### CORS Headers

**Development:**
```
CORS_ALLOW_ORIGINS=*
```

**Production:**
```
CORS_ALLOW_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## Commit Message Standards

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style (formatting, semicolons)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding/updating tests
- `chore` - Maintenance tasks

### Examples

```
feat(api): add support for cascade deletion

Implement foreign key constraints with CASCADE on delete
for automatic cleanup of child records.

Closes #42
```

```
fix(frontend): fix token persistence in localStorage

Token was being cleared on page refresh. Changed initialization
to restore from localStorage before making API calls.

Fixes #15
```

```
docs: add comprehensive API documentation

Document all endpoints, request/response formats, error codes,
and authentication mechanism.
```

---

## Testing Standards

### Test Naming

```python
# Test functions describe what they test
def test_login_with_valid_credentials():
    pass

def test_login_fails_with_invalid_password():
    pass

def test_create_lot_requires_quality_role():
    pass
```

### Test Structure

```python
# Arrange, Act, Assert pattern
def test_create_lot_success():
    # Arrange
    token = login_as('quality')
    lot_data = {
        'lot_number': 'LOT-001',
        'product_name': 'Widget',
        'initial_quantity': 100,
        'unit_measure': 'boxes'
    }
    
    # Act
    response = client.post(
        '/api/lots',
        headers={'X-Auth-Token': token},
        json=lot_data
    )
    
    # Assert
    assert response.status_code == 201
    assert response.json()['lot_number'] == 'LOT-001'
```

### Coverage Goals

| Component | Target |
|-----------|--------|
| Critical paths | 100% |
| Core logic | 80%+ |
| API handlers | 85%+ |
| Edge cases | 70%+ |

---

## Security Standards

### Input Validation

```python
# Validate field presence
required_fields = ['lot_number', 'product_name']
missing = [f for f in required_fields if not body.get(f)]

# Validate field types
initial_quantity = float(body['initial_quantity'])

# Validate field values
if initial_quantity < 0:
    raise ValueError("Quantity cannot be negative")

# Sanitize strings
lot_number = body['lot_number'].strip()
```

### Authentication

```python
# Always require token for protected endpoints
def require_auth(self) -> bool:
    if self.current_user:
        return True
    self.send_json(
        {"error": "Authentication required"},
        HTTPStatus.UNAUTHORIZED
    )
    return False
```

### Authorization

```python
# Always check role-based access
def require_zone(self, zone: str) -> bool:
    if can_access(self.current_role, zone):
        return True
    self.send_json(
        {"error": f"{self.current_role} cannot access {zone}"},
        HTTPStatus.FORBIDDEN
    )
    return False
```

### Data Protection

```python
# Use parameterized queries (already done)
cursor.execute(
    "INSERT INTO lots (lot_number, product_name) VALUES (?, ?)",
    (lot_number, product_name)
)

# Never concatenate user input into SQL
# ✗ WRONG: cursor.execute(f"INSERT INTO lots VALUES ({lot_number})")
# ✓ RIGHT: cursor.execute("INSERT INTO lots VALUES (?)", (lot_number,))
```

---

## Documentation Standards

### README Sections

```markdown
# Project Name

## Overview
Brief description and key features

## Prerequisites
Required software, versions

## Getting Started
Quick start guide

## Usage
How to use the application

## Development
Development setup, running locally

## Deployment
How to deploy

## Testing
How to run tests

## Architecture
System design overview

## Contributing
Contribution guidelines

## License
License information
```

### Code Comments

```python
# Good: explains WHY
# Use row factory for dict conversion for template compatibility
conn.row_factory = sqlite3.Row

# Bad: explains WHAT (obvious from code)
# Set row factory to Row
conn.row_factory = sqlite3.Row

# Complex logic: explain algorithm
# Three-way merge: take new, merge with current, preserve custom fields
def merge_config(base, current, custom):
    result = {...current}  # Start with current
    for key in custom:
        if key in base and base[key] != current[key]:
            # Value was changed from base, keep custom
            result[key] = custom[key]
    return result
```

### API Documentation

```markdown
### Create Lot

**Endpoint:** POST /api/lots

**Authentication:** Required (X-Auth-Token header)

**Authorization:** Requires `quality` zone access

**Request:**
```json
{
  "lot_number": "string (required, unique)",
  "product_name": "string (required)",
  "initial_quantity": "number (required, >= 0)",
  "unit_measure": "string (required)",
  "status": "string (optional, default: Draft)"
}
```

**Response:**
- 201 Created: Lot object
- 400 Bad Request: Missing/invalid fields
- 401 Unauthorized: Missing token
- 403 Forbidden: Insufficient permission
```

---

## Performance Standards

### Response Times

| Operation | Target |
|-----------|--------|
| Login | < 500ms |
| Dashboard load | < 2s |
| Create lot | < 500ms |
| Search/filter | < 1s |
| Static file serve | < 100ms |

### Optimization Checklist

- [ ] Minimize database queries (avoid N+1)
- [ ] Use indexes on frequently queried columns
- [ ] Cache static assets
- [ ] Compress responses (gzip)
- [ ] Lazy load images
- [ ] Minimize JavaScript bundle
- [ ] Minimize CSS
- [ ] Use CDN for static files

### Monitoring

```python
# Log slow queries
import time

start = time.time()
result = conn.execute(query)
duration = time.time() - start

if duration > 1.0:
    print(f"SLOW QUERY: {duration}s - {query}")
```

---

## Dependency Management

### Python

**Current:** No external dependencies

**If needed:**
```bash
# Add to requirements.txt
flask==2.3.0
sqlalchemy==2.0.0

# Install
pip install -r requirements.txt

# Lock versions
pip freeze > requirements.lock

# Update regularly
pip install --upgrade package-name
```

### JavaScript

**Current:** No external dependencies

**If needed:**
```bash
npm init
npm install package-name
npm install --save-dev dev-dependency

# Update
npm update
npm audit fix
```

---

## Version Control

### Branch Strategy

**Current:** Single main branch

**Recommended for team:**
```
main (production)
├── develop (integration)
│   ├── feature/user-management
│   ├── feature/reporting
│   ├── fix/security-issue
│   └── release/1.0.0
```

### Branching Rules

```bash
# Create feature branch
git checkout -b feature/my-feature develop

# Merge back to develop
git checkout develop
git merge --no-ff feature/my-feature

# Release to main
git checkout main
git merge --no-ff release/1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
```

---

## Configuration Management

### Environment Variables

```python
# Define in server.py or .env
import os

# Database
DB_PATH = os.getenv("DB_PATH", "sample_tracking.db")

# CORS
CORS_ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "")

# Demo data
SEED_DEMO_DATA = os.getenv("SEED_DEMO_DATA", "").lower() in ("1", "true", "yes")

# Port
PORT = int(os.getenv("PORT", 8000))
```

### Configuration Files

**Development (.env):**
```
SEED_DEMO_DATA=1
CORS_ALLOW_ORIGINS=*
PORT=8000
```

**Production (.env.production):**
```
SEED_DEMO_DATA=0
CORS_ALLOW_ORIGINS=https://yourdomain.com
PORT=8000
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [API.md](./API.md) - API endpoints
- [DATABASE.md](./DATABASE.md) - Database schema
- [TESTING.md](./TESTING.md) - Testing practices
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- README.md - Quick start
