# Sample Tracking Application - Testing Guide

## Overview

This guide covers testing strategies, test plans, and best practices for the Sample Tracking application.

**Current State:** Application has no automated tests; this document provides a framework.

**Testing Pyramid:**
```
        ▲
       ╱ ╲
      ╱ E2E╲  (End-to-End / Manual)
     ╱     ╲
    ╱───────╲
   ╱Integration╲ (API / Database)
  ╱           ╲
 ╱─────────────╲
╱   Unit Tests ╲ (Functions, Classes)
==================
```

---

## Testing Strategy

### Test Levels

1. **Unit Tests** - Test individual functions/methods
2. **Integration Tests** - Test API endpoints with real/mock database
3. **E2E Tests** - Test complete user workflows
4. **Manual Tests** - Exploratory testing, edge cases

### Scope

| Component | Current | Recommended |
|-----------|---------|-------------|
| Backend   | Manual  | Unit + Integration |
| Frontend  | Manual  | Unit + E2E |
| API       | Manual  | Integration |
| Database  | Manual  | Unit (SQL) |

---

## Unit Testing

### Test Framework

**Recommended:** `pytest` (Python testing framework)

```bash
pip install pytest pytest-cov
```

### Backend Unit Tests

#### Test: Helper Functions

**File:** `test_server.py`

```python
import pytest
from server import normalize_role, can_access

class TestAuthentication:
    def test_normalize_role_valid(self):
        assert normalize_role("ADMIN") == "admin"
        assert normalize_role("quality") == "quality"
        assert normalize_role("") == "admin"
        assert normalize_role(None) == "admin"
    
    def test_normalize_role_invalid(self):
        # Invalid roles default to admin
        assert normalize_role("invalid") == "admin"
        assert normalize_role("superuser") == "admin"

class TestAuthorization:
    def test_admin_can_access_all_zones(self):
        assert can_access("admin", "quality") == True
        assert can_access("admin", "logistics") == True
        assert can_access("admin", "marketing") == True
    
    def test_quality_role_limited_access(self):
        assert can_access("quality", "quality") == True
        assert can_access("quality", "logistics") == False
        assert can_access("quality", "marketing") == False
    
    def test_logistics_role_limited_access(self):
        assert can_access("logistics", "logistics") == True
        assert can_access("logistics", "quality") == False
        assert can_access("logistics", "marketing") == False
    
    def test_marketing_role_limited_access(self):
        assert can_access("marketing", "marketing") == True
        assert can_access("marketing", "quality") == False
        assert can_access("marketing", "logistics") == False

class TestDatabase:
    def test_query_all(self):
        # Mock database connection
        mock_conn = Mock()
        mock_conn.execute.return_value.fetchall.return_value = [
            ("name1", "value1"),
            ("name2", "value2"),
        ]
        
        result = query_all(mock_conn, "SELECT * FROM test", ())
        assert len(result) == 2
    
    def test_query_one(self):
        mock_conn = Mock()
        mock_conn.execute.return_value.fetchone.return_value = ("name", "value")
        
        result = query_one(mock_conn, "SELECT * FROM test WHERE id=?", (1,))
        assert result is not None
    
    def test_query_one_not_found(self):
        mock_conn = Mock()
        mock_conn.execute.return_value.fetchone.return_value = None
        
        result = query_one(mock_conn, "SELECT * FROM test WHERE id=?", (999,))
        assert result is None
```

**Run tests:**
```bash
pytest test_server.py -v
pytest test_server.py --cov=server --cov-report=html
```

### Frontend Unit Tests

**Recommended:** `Jest` or `Vitest` for JavaScript testing

```bash
npm install --save-dev jest @testing-library/dom
```

**Example: API utility function**

```javascript
// app.js - existing function
async function api(path, options = {}) {
  const response = await fetch(resolveApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { "X-Auth-Token": state.token } : {}),
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return response.json();
}

// test_app.js
import { api, resolveApiUrl } from './app.js';

describe('API Utility', () => {
  test('resolveApiUrl with API_BASE_URL', () => {
    window.API_BASE_URL = 'https://api.example.com';
    expect(resolveApiUrl('/test')).toBe('https://api.example.com/test');
  });

  test('resolveApiUrl without API_BASE_URL', () => {
    window.API_BASE_URL = '';
    expect(resolveApiUrl('/test')).toBe('/test');
  });

  test('api adds authentication header', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      })
    );
    
    state.token = 'test-token';
    await api('/test');
    
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Auth-Token': 'test-token'
        })
      })
    );
  });
});
```

---

## Integration Testing

### API Integration Tests

**Framework:** `pytest` with SQLite fixtures

```python
import pytest
import sqlite3
import json
import tempfile
import os
from pathlib import Path
from server import AppHandler, init_db, get_connection

@pytest.fixture
def test_db():
    """Create temporary test database"""
    fd, path = tempfile.mkstemp(suffix='.db')
    os.close(fd)
    
    # Set environment var to use test DB
    os.environ['DB_PATH'] = path
    
    # Initialize schema
    init_db()
    
    yield path
    
    # Cleanup
    os.unlink(path)

@pytest.fixture
def test_client():
    """Create test HTTP client"""
    # Would need to refactor server.py to support test mode
    pass

class TestAuthenticationAPI:
    def test_login_valid_credentials(self, test_db):
        # Make login request
        response = client.post('/api/login', json={
            'username': 'admin',
            'password': 'Admin@123'
        })
        
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        assert data['user']['username'] == 'admin'
        assert data['role'] == 'admin'
    
    def test_login_invalid_credentials(self, test_db):
        response = client.post('/api/login', json={
            'username': 'admin',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        assert response.json()['error'] == 'Invalid username or password'
    
    def test_login_missing_fields(self, test_db):
        response = client.post('/api/login', json={
            'username': 'admin'
            # Missing password
        })
        
        assert response.status_code == 401

class TestLotAPI:
    def test_create_lot_requires_auth(self, test_db):
        response = client.post('/api/lots', json={
            'lot_number': 'LOT-001',
            'product_name': 'Widget',
            'initial_quantity': 100,
            'unit_measure': 'boxes'
        })
        
        assert response.status_code == 401
        assert 'Authentication required' in response.json()['error']
    
    def test_create_lot_requires_quality_role(self, test_db):
        # Login as logistics (no quality access)
        token = login_as('logistics')
        
        response = client.post('/api/lots',
            headers={'X-Auth-Token': token},
            json={
                'lot_number': 'LOT-001',
                'product_name': 'Widget',
                'initial_quantity': 100,
                'unit_measure': 'boxes'
            }
        )
        
        assert response.status_code == 403
        assert 'cannot access quality operations' in response.json()['error']
    
    def test_create_lot_success(self, test_db):
        token = login_as('quality')
        
        response = client.post('/api/lots',
            headers={'X-Auth-Token': token},
            json={
                'lot_number': 'LOT-001',
                'product_name': 'Widget A',
                'initial_quantity': 100.0,
                'unit_measure': 'boxes'
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['lot_number'] == 'LOT-001'
        assert data['product_name'] == 'Widget A'
        assert data['status'] == 'Draft'
    
    def test_create_lot_missing_required_field(self, test_db):
        token = login_as('quality')
        
        response = client.post('/api/lots',
            headers={'X-Auth-Token': token},
            json={
                'lot_number': 'LOT-001',
                # Missing product_name
                'initial_quantity': 100,
                'unit_measure': 'boxes'
            }
        )
        
        assert response.status_code == 400
        assert 'Missing fields' in response.json()['error']
    
    def test_create_lot_duplicate_lot_number(self, test_db):
        token = login_as('quality')
        
        # Create first lot
        client.post('/api/lots',
            headers={'X-Auth-Token': token},
            json={
                'lot_number': 'LOT-001',
                'product_name': 'Widget A',
                'initial_quantity': 100,
                'unit_measure': 'boxes'
            }
        )
        
        # Try to create duplicate
        response = client.post('/api/lots',
            headers={'X-Auth-Token': token},
            json={
                'lot_number': 'LOT-001',  # Same!
                'product_name': 'Widget B',
                'initial_quantity': 50,
                'unit_measure': 'kg'
            }
        )
        
        assert response.status_code == 500  # Database constraint violation

class TestAnalysisAPI:
    def test_create_analysis(self, test_db):
        token = login_as('quality')
        
        # Create lot first
        lot = create_lot(token, 'LOT-001', 'Widget')
        
        # Create analysis
        response = client.post('/api/analyses',
            headers={'X-Auth-Token': token},
            json={
                'lot_id': lot['id'],
                'test_type': 'Viscosity',
                'spec_value': '4.5-5.5',
                'result_value': '5.1',
                'is_pass': True,
                'analyst_name': 'John Doe',
                'test_date': '2025-04-01'
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['test_type'] == 'Viscosity'
        assert data['is_pass'] == 1
    
    def test_get_analyses_by_lot(self, test_db):
        token = login_as('quality')
        lot = create_lot(token, 'LOT-001', 'Widget')
        
        # Create multiple analyses
        for i in range(3):
            create_analysis(token, lot['id'], f'Test {i}')
        
        response = client.get('/api/analyses?lot_id=' + str(lot['id']),
            headers={'X-Auth-Token': token}
        )
        
        assert response.status_code == 200
        assert len(response.json()) == 3

class TestDispatchAPI:
    def test_create_dispatch(self, test_db):
        quality_token = login_as('quality')
        logistics_token = login_as('logistics')
        
        # Quality creates lot
        lot = create_lot(quality_token, 'LOT-001', 'Widget')
        
        # Logistics creates dispatch
        response = client.post('/api/dispatches',
            headers={'X-Auth-Token': logistics_token},
            json={
                'lot_id': lot['id'],
                'customer_name': 'Customer ABC',
                'quantity_sent': 50.0,
                'courier_name': 'FedEx',
                'awb_number': 'FDX123456',
                'dispatch_date': '2025-04-02'
            }
        )
        
        assert response.status_code == 201
        assert response.json()['delivery_status'] == 'Dispatched'
    
    def test_update_dispatch_status(self, test_db):
        token = login_as('logistics')
        lot = create_lot(login_as('quality'), 'LOT-001', 'Widget')
        dispatch = create_dispatch(token, lot['id'])
        
        response = client.patch('/api/dispatch-status',
            headers={'X-Auth-Token': token},
            json={
                'dispatch_id': dispatch['id'],
                'delivery_status': 'Delivered'
            }
        )
        
        assert response.status_code == 200
        assert response.json()['delivery_status'] == 'Delivered'

class TestFeedbackAPI:
    def test_create_feedback(self, test_db):
        quality_token = login_as('quality')
        logistics_token = login_as('logistics')
        marketing_token = login_as('marketing')
        
        # Create lot and dispatch
        lot = create_lot(quality_token, 'LOT-001', 'Widget')
        dispatch = create_dispatch(logistics_token, lot['id'])
        
        # Update dispatch to delivered
        client.patch('/api/dispatch-status',
            headers={'X-Auth-Token': logistics_token},
            json={
                'dispatch_id': dispatch['id'],
                'delivery_status': 'Delivered'
            }
        )
        
        # Marketing adds feedback
        response = client.post('/api/feedback',
            headers={'X-Auth-Token': marketing_token},
            json={
                'dispatch_id': dispatch['id'],
                'rating': 4.5,
                'technical_notes': 'Good quality',
                'action_required': False,
                'marketing_person': 'Sales Rep'
            }
        )
        
        assert response.status_code == 201
        assert response.json()['rating'] == 4.5

class TestCORS:
    def test_cors_headers_with_allowlist(self):
        os.environ['CORS_ALLOW_ORIGINS'] = 'https://example.com'
        
        response = client.options('/api/login',
            headers={'Origin': 'https://example.com'}
        )
        
        assert response.headers.get('Access-Control-Allow-Origin') == 'https://example.com'
    
    def test_cors_headers_wildcard(self):
        os.environ['CORS_ALLOW_ORIGINS'] = '*'
        
        response = client.options('/api/login')
        assert response.headers.get('Access-Control-Allow-Origin') == '*'
    
    def test_cors_headers_rejected_origin(self):
        os.environ['CORS_ALLOW_ORIGINS'] = 'https://example.com'
        
        response = client.options('/api/login',
            headers={'Origin': 'https://attacker.com'}
        )
        
        assert 'Access-Control-Allow-Origin' not in response.headers
```

**Run integration tests:**
```bash
pytest test_integration.py -v --cov=server
```

---

## End-to-End Testing

### Manual E2E Test Cases

#### Test Case 1: Complete Workflow

**Objective:** Create lot → Add analysis → Create dispatch → Update status → Add feedback

**Steps:**
1. Login as `quality` user
2. Create lot "LOT-TEST-001" with 100 boxes
3. Add analysis: Viscosity = 5.0 (Pass)
4. Logout
5. Login as `logistics` user
6. Find lot and create dispatch to "Customer A"
7. Update dispatch status to "In Transit"
8. Update dispatch status to "Delivered"
9. Logout
10. Login as `marketing` user
11. Find delivered shipment and add feedback (rating 4.5)
12. Verify dashboard shows pending feedback resolved

**Expected Result:** All operations succeed, data persists, role-based access enforced

#### Test Case 2: Access Control

**Objective:** Verify role-based restrictions

**Steps:**
1. Login as `quality` user
2. Try to access `/api/dispatches` (should fail)
3. Try to access `/api/feedback` (should fail)
4. Logout
5. Login as `logistics` user
6. Try to create lot (should fail)
7. Try to add feedback (should fail)
8. Logout
9. Login as `marketing` user
10. Try to create lot (should fail)
11. Try to create dispatch (should fail)

**Expected Result:** 403 Forbidden for all unauthorized access attempts

#### Test Case 3: Data Validation

**Objective:** Test input validation and constraints

**Steps:**
1. Login as `quality` user
2. Try to create lot with negative quantity (should fail)
3. Try to create lot with empty lot_number (should fail)
4. Create valid lot
5. Try to create duplicate lot_number (should fail)
6. Logout
7. Login as `logistics` user
8. Try to create dispatch with negative quantity (should fail)
9. Create valid dispatch
10. Try to create dispatch for non-existent lot (should fail)

**Expected Result:** Invalid inputs rejected with 400 Bad Request

#### Test Case 4: Cascade Delete

**Objective:** Verify cascade deletes work correctly

**Steps:**
1. Create lot with analysis
2. Delete lot from database (raw SQL)
3. Verify analysis was deleted
4. Create lot with dispatch and feedback
5. Delete dispatch
6. Verify feedback was deleted

**Expected Result:** All child records deleted when parent deleted

#### Test Case 5: Responsive Design

**Objective:** Verify UI works on mobile

**Device:** iPhone 12 (375px width)

**Steps:**
1. Login
2. View dashboard → should show card layout on mobile
3. Click lot → should expand details
4. Create new lot → should use mobile-friendly form
5. Verify all buttons/links are tappable (44px minimum)

**Expected Result:** App is usable on mobile devices

---

## Automated E2E Testing

**Recommended:** Playwright or Cypress

```javascript
// playwright.config.js
export default {
  testDir: './e2e',
  webServer: {
    command: 'python3 server.py',
    port: 8000,
  },
};
```

```javascript
// e2e/auth.spec.js
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:8000/login.html');
    await page.fill('input[name=username]', 'admin');
    await page.fill('input[name=password]', 'Admin@123');
    await page.click('button[type=submit]');
    await page.waitForURL('http://localhost:8000/');
    expect(await page.textContent('.session-badge')).toContain('ADMIN');
  });

  test('login with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:8000/login.html');
    await page.fill('input[name=username]', 'admin');
    await page.fill('input[name=password]', 'wrong');
    await page.click('button[type=submit]');
    expect(await page.textContent('#login-error')).toContain('Invalid username');
  });

  test('protected endpoints require auth', async ({ page }) => {
    await page.goto('http://localhost:8000/');
    await page.waitForURL('http://localhost:8000/login.html');
  });
});

test.describe('Workflow', () => {
  test('complete quality workflow', async ({ page }) => {
    await login(page, 'quality');
    
    // Create lot
    await page.click('[data-action=create-lot]');
    await page.fill('[name=lot_number]', 'LOT-001');
    await page.fill('[name=product_name]', 'Widget A');
    await page.fill('[name=initial_quantity]', '100');
    await page.fill('[name=unit_measure]', 'boxes');
    await page.click('button[type=submit]');
    
    // Verify lot created
    expect(await page.textContent('body')).toContain('LOT-001');
    
    // Add analysis
    await page.click('[data-action=add-analysis]');
    await page.fill('[name=test_type]', 'Viscosity');
    await page.fill('[name=spec_value]', '4.5-5.5');
    await page.fill('[name=result_value]', '5.1');
    await page.click('[name=is_pass]');
    await page.click('button[type=submit]');
    
    // Verify analysis created
    expect(await page.textContent('body')).toContain('Viscosity');
  });
});

async function login(page, username) {
  await page.goto('http://localhost:8000/login.html');
  await page.fill('[name=username]', username);
  await page.fill('[name=password]', `${username.capitalize()}@123`);
  await page.click('button[type=submit]');
  await page.waitForURL('http://localhost:8000/');
}
```

**Run E2E tests:**
```bash
npm install -D @playwright/test
npx playwright test
```

---

## Load Testing

**Recommended:** Apache JMeter or k6

```javascript
// k6 load test
import http from 'k6/http';
import { check } from 'k6';

const API_BASE = 'http://localhost:8000';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  // Login
  let loginRes = http.post(`${API_BASE}/api/login`, {
    username: 'quality',
    password: 'Quality@123',
  });
  let token = loginRes.json().token;

  // Create lot
  let lot = http.post(
    `${API_BASE}/api/lots`,
    {
      lot_number: `LOT-${Date.now()}`,
      product_name: 'Test Product',
      initial_quantity: 100,
      unit_measure: 'boxes',
    },
    {
      headers: {
        'X-Auth-Token': token,
        'Content-Type': 'application/json',
      },
    }
  );

  check(lot, {
    'status is 201': (r) => r.status === 201,
    'has lot_id': (r) => r.json().id > 0,
  });
}
```

**Run load test:**
```bash
k6 run load-test.js
```

---

## Security Testing

### OWASP Top 10 Checklist

- [ ] **Injection** - SQL injection (parameterized queries used ✓)
- [ ] **Broken Auth** - Token validation, password hashing
- [ ] **Sensitive Data** - HTTPS, secure headers
- [ ] **XML/XXE** - Not applicable (JSON only)
- [ ] **Broken Access Control** - RBAC enforcement
- [ ] **Security Misconfiguration** - Demo credentials, logging
- [ ] **XSS** - Input sanitization, CSP headers
- [ ] **Insecure Deserialization** - JSON parsing validated
- [ ] **Vulnerable Dependencies** - Zero external deps ✓
- [ ] **Insufficient Logging** - Audit trail

### Test Cases

```python
def test_sql_injection():
    """Verify SQL injection is prevented"""
    token = login_as('quality')
    
    # Attempt SQL injection in lot_number
    response = client.post('/api/lots',
        headers={'X-Auth-Token': token},
        json={
            'lot_number': "'; DROP TABLE lots; --",
            'product_name': 'Attack',
            'initial_quantity': 1,
            'unit_measure': 'test'
        }
    )
    
    # Should create lot with malicious string as value
    assert response.status_code == 201
    assert response.json()['lot_number'] == "'; DROP TABLE lots; --"
    
    # Verify table still exists
    response = client.get('/api/session', headers={'X-Auth-Token': token})
    assert response.status_code == 200

def test_xss_prevention():
    """Verify XSS is prevented"""
    token = login_as('quality')
    
    response = client.post('/api/lots',
        headers={'X-Auth-Token': token},
        json={
            'lot_number': '<script>alert("XSS")</script>',
            'product_name': 'XSS Test',
            'initial_quantity': 1,
            'unit_measure': 'test'
        }
    )
    
    # Should persist script tag safely
    lot = response.json()
    assert '<script>' in lot['lot_number']
    # Frontend should escape on render

def test_token_compromise():
    """Verify token cannot be reused after logout"""
    token = login_as('quality')
    
    # Create lot with valid token
    response = client.post('/api/lots',
        headers={'X-Auth-Token': token},
        json={'lot_number': 'LOT-001', 'product_name': 'Test', 
              'initial_quantity': 1, 'unit_measure': 'test'}
    )
    assert response.status_code == 201
    
    # Logout
    client.post('/api/logout', headers={'X-Auth-Token': token})
    
    # Try to use token after logout
    response = client.post('/api/lots',
        headers={'X-Auth-Token': token},
        json={'lot_number': 'LOT-002', 'product_name': 'Test2',
              'initial_quantity': 1, 'unit_measure': 'test'}
    )
    assert response.status_code == 401
```

---

## Test Coverage Goals

| Component | Current | Goal |
|-----------|---------|------|
| server.py | 0% | 80%+ |
| app.js | 0% | 70%+ |
| Database | 0% | 90%+ |
| API Endpoints | 0% | 85%+ |

**Generate coverage report:**
```bash
pytest --cov=server --cov-report=html
# Open htmlcov/index.html
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.11', '3.12']
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Install dependencies
      run: |
        pip install pytest pytest-cov
    
    - name: Run tests
      run: pytest test_server.py -v --cov=server
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

---

## Test Data Management

### Fixture Library

```python
# fixtures.py
import pytest
import sqlite3
from server import get_connection

@pytest.fixture
def quality_token(test_client):
    response = test_client.post('/api/login', json={
        'username': 'quality',
        'password': 'Quality@123'
    })
    return response.json()['token']

@pytest.fixture
def sample_lot(test_client, quality_token):
    response = test_client.post('/api/lots',
        headers={'X-Auth-Token': quality_token},
        json={
            'lot_number': 'LOT-TEST-001',
            'product_name': 'Test Product',
            'initial_quantity': 100,
            'unit_measure': 'boxes'
        }
    )
    return response.json()

@pytest.fixture
def sample_analysis(test_client, quality_token, sample_lot):
    response = test_client.post('/api/analyses',
        headers={'X-Auth-Token': quality_token},
        json={
            'lot_id': sample_lot['id'],
            'test_type': 'pH',
            'spec_value': '6.8-7.2',
            'result_value': '7.0',
            'is_pass': True
        }
    )
    return response.json()
```

---

## Troubleshooting Tests

### Issue: Database locked

**Solution:** Create fresh DB per test, use temp file
```python
@pytest.fixture
def test_db():
    fd, path = tempfile.mkstemp()
    os.close(fd)
    yield path
    os.unlink(path)
```

### Issue: Tests fail in CI but pass local

**Solution:** Ensure deterministic order, isolate state
```bash
pytest --cache-clear --tb=long
```

### Issue: Flaky E2E tests

**Solution:** Increase timeouts, wait for specific states
```javascript
await page.waitForSelector('.session-badge', { timeout: 5000 });
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [API.md](./API.md) - API endpoints
- [DATABASE.md](./DATABASE.md) - Database schema
- README.md - Quick start
