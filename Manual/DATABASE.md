# Sample Tracking Database Schema

## Overview

Sample Tracking uses SQLite3 as its database engine. The database is stored as a single file (`sample_tracking.db`).

**Features:**
- Foreign key constraints enabled (`PRAGMA foreign_keys = ON`)
- Automatic timestamps via `DEFAULT CURRENT_TIMESTAMP`
- No external ORM; raw SQL with row factory
- Compatible with GitHub Pages deployment (backend elsewhere)

---

## Tables

### `lots`

Root entity representing a product lot/batch.

```sql
CREATE TABLE IF NOT EXISTS lots (
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
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique lot identifier |
| lot_number | TEXT | NOT NULL, UNIQUE | External lot identifier (e.g., "LOT-2025-001") |
| product_name | TEXT | NOT NULL | Name of product (e.g., "Premium Widget") |
| initial_quantity | REAL | >= 0 | Initial quantity in specified unit |
| unit_measure | TEXT | NOT NULL | Unit of measurement (kg, L, boxes, etc.) |
| project_ref | TEXT | DEFAULT '' | Reference to parent project (legacy: npd_project_ref) |
| notes | TEXT | DEFAULT '' | Free-form notes about the lot |
| status | TEXT | DEFAULT 'Draft' | Lot status (Draft, Active, Closed) |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | ISO8601 timestamp when lot created |

**Unique Constraints:**
- `lot_number` - Prevents duplicate lot numbers

**Check Constraints:**
- `initial_quantity >= 0` - Non-negative quantities only

**Indexes:** None (primary key exists)

---

### `analyses`

Quality test results associated with a lot.

```sql
CREATE TABLE IF NOT EXISTS analyses (
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

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Test result identifier |
| lot_id | INTEGER | NOT NULL, FK → lots.id | Reference to parent lot (CASCADE on delete) |
| test_type | TEXT | NOT NULL | Type of test (Viscosity, pH, Color, etc.) |
| spec_value | TEXT | NOT NULL | Specification range/value (e.g., "4.5-5.5") |
| result_value | TEXT | NOT NULL | Actual result value (e.g., "5.1") |
| is_pass | INTEGER | DEFAULT 0 | Pass/fail flag (0=fail, 1=pass) |
| analyst_name | TEXT | NOT NULL | Name of analyst who performed test |
| test_date | TEXT | DEFAULT CURRENT_TIMESTAMP | Test date (ISO format) |

**Foreign Keys:**
- `lot_id` → `lots.id` with `ON DELETE CASCADE` (delete analysis if lot deleted)

**Indexes:** None (primary key exists)

**Example Data:**
```sql
INSERT INTO analyses VALUES 
  (1, 1, 'Viscosity', '4.5-5.5', '5.1', 1, 'John Doe', '2025-04-01'),
  (2, 1, 'pH', '6.8-7.2', '7.0', 1, 'Jane Smith', '2025-04-01');
```

---

### `dispatches`

Shipment records for lots sent to customers.

```sql
CREATE TABLE IF NOT EXISTS dispatches (
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

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Shipment identifier |
| lot_id | INTEGER | NOT NULL, FK → lots.id | Reference to parent lot |
| customer_name | TEXT | NOT NULL | Name of customer receiving shipment |
| quantity_sent | REAL | > 0 | Quantity shipped in lot's unit measure |
| courier_name | TEXT | NOT NULL | Shipping courier (DHL, FedEx, etc.) |
| awb_number | TEXT | NOT NULL | Air waybill or tracking number |
| dispatch_date | TEXT | NOT NULL | Date shipment was dispatched |
| delivery_status | TEXT | DEFAULT 'Dispatched' | Status (Dispatched, In Transit, Delivered) |

**Foreign Keys:**
- `lot_id` → `lots.id` with `ON DELETE CASCADE`

**Check Constraints:**
- `quantity_sent > 0` - Must send positive quantity

**Indexes:** None

**Example Data:**
```sql
INSERT INTO dispatches VALUES 
  (1, 1, 'Customer ABC', 50.0, 'FedEx', 'FDX123456', '2025-04-02', 'Delivered'),
  (2, 1, 'Customer XYZ', 30.0, 'DHL', 'DHL789012', '2025-04-03', 'In Transit');
```

---

### `feedback`

Customer feedback collected post-delivery.

```sql
CREATE TABLE IF NOT EXISTS feedback (
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

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | Feedback identifier |
| dispatch_id | INTEGER | NOT NULL, UNIQUE, FK | Reference to dispatch (one feedback per shipment) |
| rating | REAL | 0-5, NOT NULL | Customer satisfaction rating |
| technical_notes | TEXT | NOT NULL | Detailed feedback notes |
| action_required | INTEGER | DEFAULT 0 | Action required flag (0=no, 1=yes) |
| next_steps | TEXT | DEFAULT '' | Recommended next steps |
| marketing_person | TEXT | NOT NULL | Marketing person who collected feedback |
| feedback_date | TEXT | DEFAULT CURRENT_TIMESTAMP | Date feedback received |

**Foreign Keys:**
- `dispatch_id` → `dispatches.id` with `ON DELETE CASCADE`

**Unique Constraints:**
- `dispatch_id` - Only one feedback record per dispatch

**Check Constraints:**
- `rating >= 0 AND rating <= 5` - Rating scale 0-5

**Indexes:** None

**Example Data:**
```sql
INSERT INTO feedback VALUES 
  (1, 1, 4.5, 'Product quality excellent, delivery on time', 0, 'Continue current quality standards', 'Marketing Team', '2025-04-05'),
  (2, 2, 3.0, 'Good product but packaging could be improved', 1, 'Review packaging design', 'Sales Rep', '2025-04-06');
```

---

## Relationships

### Entity-Relationship Diagram

```
┌────────────────────┐
│       lots         │
│ (parent entity)    │
│                    │
│ id (PK)           │
│ lot_number (U)    │
│ product_name      │
│ initial_quantity  │
│ unit_measure      │
│ project_ref       │
│ status            │
│ created_at        │
└────────────────────┘
         │
         │
    ┌────┴────────────────────┐
    │                         │
    ▼                         ▼
┌─────────────────────┐   ┌──────────────────┐
│    analyses         │   │   dispatches     │
│  (N:1 with lots)    │   │  (N:1 with lots) │
│                     │   │                  │
│ id (PK)             │   │ id (PK)          │
│ lot_id (FK)         │   │ lot_id (FK)      │
│ test_type           │   │ customer_name    │
│ spec_value          │   │ quantity_sent    │
│ result_value        │   │ courier_name     │
│ is_pass             │   │ delivery_status  │
│ analyst_name        │   │ dispatch_date    │
│ test_date           │   │                  │
└─────────────────────┘   └──────────────────┘
                               │
                               │
                               ▼
                          ┌──────────────────┐
                          │    feedback      │
                          │  (1:1 with      │
                          │   dispatches)   │
                          │                  │
                          │ id (PK)          │
                          │ dispatch_id (FK) │
                          │ rating           │
                          │ technical_notes  │
                          │ action_required  │
                          │ next_steps       │
                          │ marketing_person │
                          │ feedback_date    │
                          └──────────────────┘
```

### Relationships

1. **lots ↔ analyses (1:N)**
   - One lot has many analyses
   - Delete lot → cascading delete analyses

2. **lots ↔ dispatches (1:N)**
   - One lot can be shipped multiple times
   - Delete lot → cascading delete dispatches

3. **dispatches ↔ feedback (1:1)**
   - One dispatch has at most one feedback
   - Delete dispatch → cascading delete feedback

---

## Data Types

| SQLite Type | Python Type | JSON Type | Examples |
|-------------|-------------|-----------|----------|
| INTEGER | int | number | 1, 42, 100 |
| REAL | float | number | 1.5, 99.99, 0.0 |
| TEXT | str | string | "LOT-001", "Premium Widget" |
| BLOB | bytes | (not used) | - |

---

## Constraints & Validation

### Field-Level Constraints

| Table | Field | Constraint | Enforcement |
|-------|-------|----------|------------|
| lots | lot_number | UNIQUE | Database primary key |
| lots | initial_quantity | >= 0 | CHECK constraint |
| analyses | is_pass | 0 or 1 | Application logic |
| dispatches | quantity_sent | > 0 | CHECK constraint |
| feedback | rating | 0-5 | CHECK constraint |
| feedback | dispatch_id | UNIQUE | Database unique constraint |

### Referential Integrity

Foreign key constraints with `ON DELETE CASCADE`:
- Deleting a lot deletes all related analyses and dispatches
- Deleting a dispatch deletes related feedback
- No orphaned records possible (with FK constraints enabled)

### Temporal Constraints

- All `created_at` and `*_date` fields default to current timestamp
- Dates stored as TEXT in ISO8601 format for SQLite compatibility
- Timezone: UTC (Z suffix)

---

## Migrations

### Migration Function: `migrate_db()`

Handles schema evolution without breaking changes:

```python
def migrate_db(conn: sqlite3.Connection) -> None:
    columns = {row[1] for row in conn.execute("PRAGMA table_info(lots)").fetchall()}
    
    # Rename npd_project_ref to project_ref (legacy)
    if "project_ref" not in columns and "npd_project_ref" in columns:
        conn.execute("ALTER TABLE lots ADD COLUMN project_ref TEXT DEFAULT ''")
        columns.add("project_ref")
    
    if "project_ref" in columns and "npd_project_ref" in columns:
        conn.execute("""
            UPDATE lots
            SET project_ref = COALESCE(npd_project_ref, '')
            WHERE COALESCE(project_ref, '') = ''
        """)
```

**How It Works:**
1. Check if `npd_project_ref` column exists (old schema)
2. If yes, create new `project_ref` column
3. Copy data from `npd_project_ref` to `project_ref`
4. Old column left in place for compatibility

**Future Migrations:** Add additional blocks to handle new schema changes.

---

## Database Initialization

### Creating a Fresh Database

```python
import sqlite3
from pathlib import Path

DB_PATH = Path("sample_tracking.db")

def init_db():
    should_seed = not DB_PATH.exists()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        
        # Create schema
        conn.executescript(SCHEMA)
        
        # Run migrations
        migrate_db(conn)
        
        # Seed demo data (optional)
        if should_seed and SEED_DEMO_DATA and SEED:
            for sql, rows in SEED:
                conn.executemany(sql, rows)
        
        conn.commit()
```

### Seeding Demo Data

Controlled by `SEED_DEMO_DATA` environment variable:

```bash
# Enable seeding on first run
export SEED_DEMO_DATA=1
python3 server.py
```

Data format:
```python
SEED = [
    ("INSERT INTO lots VALUES (?, ?, ?)", [
        (None, "LOT-001", "Product A"),
        (None, "LOT-002", "Product B"),
    ]),
]
```

---

## Query Examples

### Get All Lots with Analysis Count

```sql
SELECT
  l.id,
  l.lot_number,
  l.product_name,
  COUNT(DISTINCT a.id) AS analysis_count
FROM lots l
LEFT JOIN analyses a ON a.lot_id = l.id
GROUP BY l.id
ORDER BY datetime(l.created_at) DESC;
```

### Get Delivered Shipments with Feedback Status

```sql
SELECT
  d.id AS dispatch_id,
  d.customer_name,
  l.lot_number,
  d.delivery_status,
  f.id AS feedback_id,
  f.rating
FROM dispatches d
JOIN lots l ON l.id = d.lot_id
LEFT JOIN feedback f ON f.dispatch_id = d.id
WHERE d.delivery_status = 'Delivered'
ORDER BY date(d.dispatch_date) DESC;
```

### Find Lots with Failed Analyses

```sql
SELECT DISTINCT
  l.id,
  l.lot_number,
  l.product_name,
  a.test_type,
  a.result_value
FROM lots l
JOIN analyses a ON a.lot_id = l.id
WHERE a.is_pass = 0;
```

### Get Dashboard Metrics

```sql
-- Total lots
SELECT COUNT(*) FROM lots;

-- Open (non-closed) lots
SELECT COUNT(*) FROM lots WHERE status != 'Closed';

-- Delivered shipments
SELECT COUNT(*) FROM dispatches WHERE delivery_status = 'Delivered';

-- Pending feedback (delivered but no feedback)
SELECT COUNT(*)
FROM dispatches d
LEFT JOIN feedback f ON f.dispatch_id = d.id
WHERE d.delivery_status = 'Delivered' AND f.id IS NULL;
```

---

## Performance Considerations

### Current State

- **No indexes** beyond primary keys
- **No table statistics** (SQLite auto-analyzes)
- **Row factory** used for dict conversion (small overhead)
- **Foreign key checks** enabled (prevents corruption, small overhead)

### Query Performance

| Operation | Time Complexity | Notes |
|-----------|-----------------|-------|
| Get lot by ID | O(1) | Primary key lookup |
| Get lot by lot_number | O(n) | Full table scan (should index) |
| Get all analyses for lot | O(n) | Foreign key scan |
| Dashboard (with JOINs) | O(n²) | Multiple aggregations |
| Get feedback by dispatch | O(1) | Unique constraint |

### Recommendations for Production

1. **Add indexes:**
   ```sql
   CREATE INDEX idx_analyses_lot_id ON analyses(lot_id);
   CREATE INDEX idx_dispatches_lot_id ON dispatches(lot_id);
   CREATE INDEX idx_dispatches_delivery_status ON dispatches(delivery_status);
   CREATE INDEX idx_feedback_dispatch_id ON feedback(dispatch_id);
   ```

2. **Analyze statistics:**
   ```sql
   ANALYZE;
   ```

3. **Consider pagination** for large datasets

4. **Monitor query times** with execution plans:
   ```sql
   EXPLAIN QUERY PLAN SELECT ...;
   ```

---

## Backup & Restore

### Manual Backup

```bash
# Copy database file
cp sample_tracking.db sample_tracking.db.backup

# Or SQL dump
sqlite3 sample_tracking.db ".dump" > backup.sql
```

### Restore from Backup

```bash
# From file copy
cp sample_tracking.db.backup sample_tracking.db

# From SQL dump
sqlite3 sample_tracking.db < backup.sql
```

### Automated Backups (Recommended)

```bash
# Daily backup script
0 2 * * * cp /var/data/sample_tracking.db /backups/sample_tracking.db.$(date +\%Y\%m\%d)
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| SEED_DEMO_DATA | "" (disabled) | Set to "1" to seed demo data on first run |
| SAMPLE_TRACKING_DB_PATH | "./sample_tracking.db" | SQLite database file path (Render uses `/var/data/`) |

---

## Troubleshooting

### Issue: "database is locked"

**Cause:** Multiple processes accessing same SQLite file

**Solution:**
```python
conn.execute("PRAGMA busy_timeout = 5000")  # Wait 5 seconds
```

### Issue: Foreign key constraint violated

**Cause:** Trying to insert child record without valid parent

**Solution:** Ensure parent record exists before creating children

### Issue: Queries slower over time

**Cause:** Missing indexes on frequently queried columns

**Solution:** Add indexes (see Performance section)

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API.md](./API.md) - API endpoints returning database records
- [TESTING.md](./TESTING.md) - Database testing practices
- README.md - Quick start
