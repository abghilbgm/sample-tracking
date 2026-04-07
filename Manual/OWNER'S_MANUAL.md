# Sample Tracking Application - Owner's Manual

*Complete practical guide for understanding, running, and operating the Sample Tracking application.*

---

## 🎯 What Is This?

Sample Tracking is a role-based web application for managing product quality, inventory, and customer feedback.

**Key Features:**
- 👤 **Role-based access control** - Different views for quality, logistics, marketing teams
- 📦 **Lot management** - Track product batches from creation to delivery
- 🧪 **Quality testing** - Record lab analyses and test results
- 🚚 **Shipment tracking** - Manage customer shipments and delivery status
- ⭐ **Customer feedback** - Collect post-delivery ratings and notes

**Built with:** Python backend + JavaScript frontend + SQLite database

---

## ⚡ Quick Start (5 minutes)

### 1. Install Python 3.12+

```bash
python3 --version  # Should show 3.12 or higher
```

### 2. Run the Application

```bash
cd /Users/gowtham/Downloads/ABG_HILBGM/NPD
python3 server.py
```

### 3. Open Your Browser

- **V1 (recommended):** http://127.0.0.1:8000
- **V1 Login:** http://127.0.0.1:8000/login.html
- **V2 Alternative:** http://127.0.0.1:8010

### 4. Login with Demo Credentials

```
Username: admin
Password: Admin@123
```

**Other demo users:**
- `quality / Quality@123` - For quality team
- `logistics / Logistics@123` - For shipping team
- `marketing / Marketing@123` - For customer feedback

### 5. Explore

- Create a new product lot
- Add quality test results
- Create a shipment
- Update delivery status
- Add customer feedback

---

## 🎬 Main Workflows

### Workflow 1: Quality Testing (Quality Team)

1. **Login** as `quality` user
2. **Create Lot** - Product name, quantity, unit
3. **Add Analysis** - Test type, specification, result, pass/fail
4. **Track** - View all tests for a lot on dashboard

**Time:** ~5 minutes per lot

### Workflow 2: Shipment Management (Logistics Team)

1. **Login** as `logistics` user
2. **View Inventory** - See available lots
3. **Create Dispatch** - Select lot, customer, quantity, courier
4. **Track Shipment** - Update delivery status (Dispatched → In Transit → Delivered)

**Time:** ~3 minutes per shipment

### Workflow 3: Customer Feedback (Marketing Team)

1. **Login** as `marketing` user
2. **View Delivered Shipments** - Dashboard shows delivered items
3. **Add Feedback** - Rating, technical notes, action items
4. **Track** - See feedback metrics on dashboard

**Time:** ~2 minutes per shipment

---

## 📊 Data Structure

### Product Lots
The main entity. Contains:
- Lot number (unique identifier)
- Product name
- Initial quantity
- Unit of measure (kg, boxes, liters, etc.)
- Status (Draft, Active, Closed)
- Created date
- Notes/project reference

**Relationships:**
- A lot can have multiple quality analyses
- A lot can have multiple shipments

### Quality Analyses
Test results tied to a lot:
- Test type (Viscosity, pH, Color, etc.)
- Specification (expected range)
- Actual result
- Pass/Fail
- Analyst name
- Test date

**Example:** Lot-001 has pH test (spec: 6.8-7.2, result: 7.0, pass: ✓)

### Shipments (Dispatches)
Sending a lot (or portion) to customer:
- Lot being shipped
- Customer name
- Quantity sent
- Courier name
- Tracking number (AWB)
- Dispatch date
- Delivery status (Dispatched, In Transit, Delivered)

**Example:** Lot-001, 50 units sent to Customer A via FedEx

### Customer Feedback
Post-delivery feedback on one shipment:
- Shipment (dispatch)
- Rating (0-5 stars)
- Technical notes
- Action required (yes/no)
- Next steps
- Marketing person
- Feedback date

**Example:** Shipment received well, rating 4.5/5, on-time delivery

---

## 🔐 User Roles & Permissions

### Admin Role
- ✓ Access all features (quality, logistics, marketing)
- ✓ Can do everything
- **Demo login:** `admin / Admin@123`

### Quality Role
- ✓ Create product lots
- ✓ Add quality analyses
- ✓ View all lots with test results
- ✗ Cannot access shipping/feedback

**Demo login:** `quality / Quality@123`

### Logistics Role
- ✓ View available inventory
- ✓ Create shipments
- ✓ Update delivery status
- ✗ Cannot create lots or access feedback

**Demo login:** `logistics / Logistics@123`

### Marketing Role
- ✓ View delivered shipments
- ✓ Add customer feedback
- ✓ See feedback metrics
- ✗ Cannot create lots or manage shipments

**Demo login:** `marketing / Marketing@123`

---

## 💾 Data Storage

### Database Location

**Local development:**
```
/Users/gowtham/Downloads/ABG_HILBGM/NPD/sample_tracking.db
```

**Docker deployment:**
```
/var/data/sample_tracking.db
```

### File Format
SQLite3 database (binary file, ~1MB typical)

### Backup Your Data

```bash
# Simple copy
cp sample_tracking.db sample_tracking.db.backup

# Compressed
gzip -c sample_tracking.db > sample_tracking.db.gz

# Or export as SQL
sqlite3 sample_tracking.db ".dump" > backup.sql
```

### Restore from Backup

```bash
# From backup copy
cp sample_tracking.db.backup sample_tracking.db

# From SQL dump
sqlite3 sample_tracking.db < backup.sql
```

---

## 🛠 Common Tasks

### "I need to reset the database"

```bash
# Stop server (Ctrl+C)
# Delete the database
rm sample_tracking.db

# Restart server
python3 server.py

# Fresh database created automatically
```

### "I forgot the password"

**Can't log in?**

1. Edit `server.py`
2. Find `USERS` dictionary (~line 12)
3. Change password for your user
4. Restart server
5. Login with new password

```python
USERS = {
    "admin": {"password": "YOUR_NEW_PASSWORD", ...},
    # ...
}
```

### "I want to seed demo data"

```bash
export SEED_DEMO_DATA=1
python3 server.py
```

First run will create sample lots, analyses, shipments, and feedback.

### "Can I use this with multiple users simultaneously?"

Current SQLite implementation supports one active session per user. For concurrent users:

1. Upgrade to PostgreSQL (recommended for production)
2. Use cloud deployment (Render.com, AWS)
3. Implement connection pooling

See [DEPLOYMENT.md](./DEPLOYMENT.md) for scaling options.

### "How do I change the port?"

Edit `server.py` or use environment variable:

```python
# In server.py, find:
PORT = 8000

# Change to:
PORT = 9000

# Or set environment:
export PORT=9000
python3 server.py
```

### "I need to export data"

```bash
# Export to CSV (using sqlite3 CLI)
sqlite3 sample_tracking.db <<EOF
.headers on
.mode csv
.output lots.csv
SELECT * FROM lots;
.output analyses.csv
SELECT * FROM analyses;
EOF

# Now you have lots.csv and analyses.csv
```

---

## 🌐 Deployment Options

### Option 1: Local Computer (Development)
```bash
python3 server.py
# Access: http://127.0.0.1:8000
# Best for: Testing, demo
```

### Option 2: Docker Container
```bash
docker build -t sample-tracking .
docker run -p 8000:8000 -v $(pwd)/data:/var/data sample-tracking
# Best for: Portable, consistent environments
```

### Option 3: Render.com (Easiest for Production)
1. Push code to GitHub
2. Connect GitHub to Render.com
3. Deploy (Render handles the rest)
4. Public URL: `https://your-app.onrender.com`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Option 4: GitHub Pages + Remote Backend
1. Frontend hosted on GitHub Pages (free)
2. Backend on Render.com or AWS ($7+/month)
3. Configure API endpoint in `docs/config.js`

---

## 📈 Monitoring & Health

### Is the application running?

```bash
# Check if server responds
curl http://127.0.0.1:8000/

# Should return HTML (login page)
```

### View logs

**Local:**
```bash
# Logs print to console
# Error: "database is locked"
# Solution: Restart server, close other connections

# Check database size
du -sh sample_tracking.db

# If >1GB, consider cleanup/archival
```

**Render.com:**
- Dashboard → Logs tab
- Real-time logs of all requests/errors
- 30-day retention

### Performance issues?

**Slow queries?**
- Check database size: `du -sh sample_tracking.db`
- Too many records? Archive old data
- Add database indexes (see [DATABASE.md](./DATABASE.md))

**High CPU usage?**
- Single user? Normal for SQLite
- Multiple users? Upgrade to PostgreSQL

**Memory usage?**
- Check running processes: `ps aux | grep python`
- Restart if leaking memory

---

## 🔧 Troubleshooting

### "Port 8000 is already in use"

```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=8001 python3 server.py
```

### "Database is locked"

```bash
# Close all connections and restart
Ctrl+C  # Stop the server

# Wait 5 seconds for locks to release
sleep 5

# Restart
python3 server.py
```

### "Login always fails"

1. Check credentials in demo users table
2. Clear browser cookies/cache
3. Try incognito/private mode
4. Restart server

### "Data disappeared"

1. Did you delete the database by mistake?
   - Check for `sample_tracking.db.backup`
   - Restore: `cp sample_tracking.db.backup sample_tracking.db`

2. Did you restart with `SEED_DEMO_DATA=1`?
   - It doesn't overwrite; check the data is really gone

3. Did you run from different directory?
   - Database is created in current directory
   - Use full path: `ls -la /path/to/sample_tracking.db`

### "Can't upload file / import data"

**Current limitation:** No file upload feature exists

**Workaround:**
1. Create data manually through UI
2. Or use Python script to insert directly:
   ```python
   import sqlite3
   conn = sqlite3.connect('sample_tracking.db')
   conn.execute("INSERT INTO lots VALUES (...)")
   conn.commit()
   ```

### "Security concern: Passwords in code!"

**This is a demo application** with hardcoded credentials for learning.

**For production:**
1. Use proper authentication (OAuth2, SAML)
2. Hash passwords with bcrypt
3. Use environment variables for secrets
4. Use managed authentication service (Okta, Auth0)

See [DEPLOYMENT.md](./DEPLOYMENT.md#production-hardening-checklist)

---

## 📚 Full Documentation

This manual is a quick reference. For complete information:

| Topic | Document |
|-------|----------|
| System design | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| API endpoints | [API.md](./API.md) |
| Database schema | [DATABASE.md](./DATABASE.md) |
| Testing | [TESTING.md](./TESTING.md) |
| Deployment | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Code standards | [STANDARDS.md](./STANDARDS.md) |
| Documentation guide | [DOCUMENTATION.md](./DOCUMENTATION.md) |

---

## ✅ Operational Checklist

### Daily
- [ ] Check application is running
- [ ] Verify no error messages in logs
- [ ] Database file exists (`sample_tracking.db`)

### Weekly
- [ ] Backup database
- [ ] Review user feedback logs
- [ ] Check disk space

### Monthly
- [ ] Review performance metrics
- [ ] Update logs
- [ ] Archive old data if needed
- [ ] Review security (who has access)

### Quarterly
- [ ] Full database backup to offline storage
- [ ] Test backup restoration
- [ ] Review active users and their roles
- [ ] Plan capacity for next quarter

### Annually
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Upgrade to latest Python version
- [ ] Plan architecture improvements

---

## 🚀 Next Steps

### To Get Running Today
1. Run `python3 server.py`
2. Open http://127.0.0.1:8000
3. Login as `admin / Admin@123`
4. Create a test lot

### To Understand the System
1. Read this manual completely
2. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
3. Explore the UI with different user roles

### To Deploy to Production
1. Read [DEPLOYMENT.md](./DEPLOYMENT.md) completely
2. Choose your platform (Render recommended for simplicity)
3. Follow step-by-step deployment guide
4. Configure CORS headers for your domain
5. Set up monitoring and backups

### To Customize/Extend
1. Read [STANDARDS.md](./STANDARDS.md) for code guidelines
2. Check [API.md](./API.md) to understand endpoints
3. Review [DATABASE.md](./DATABASE.md) if adding tables
4. Add tests per [TESTING.md](./TESTING.md)

### To Contribute
1. Follow [STANDARDS.md](./STANDARDS.md) for code style
2. Update relevant docs when making changes
3. Test thoroughly (see [TESTING.md](./TESTING.md))
4. Submit PR with documentation updates

---

## 📞 Help & Support

### Where to Find Information

| Question | Look Here |
|----------|-----------|
| How do I...? | This document (OWNER'S MANUAL.md) |
| What fields does lot have? | [DATABASE.md](./DATABASE.md) |
| How do I call an API? | [API.md](./API.md) |
| How do I deploy? | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| How do I write code? | [STANDARDS.md](./STANDARDS.md) |
| How do I test? | [TESTING.md](./TESTING.md) |
| How does it work? | [ARCHITECTURE.md](./ARCHITECTURE.md) |

### Common Quick Links

- **Start here:** [README.md](./README.md)
- **Documentation index:** [DOCUMENTATION.md](./DOCUMENTATION.md)
- **This manual:** OWNER'S_MANUAL.md

---

## 💡 Tips & Tricks

### Keyboard Shortcuts
- Tab / Shift+Tab - Navigate between form fields
- Enter - Submit form
- Escape - Close modal

### UI Tips
- Click lot number to see details
- Red badges = needs action
- Yellow badges = pending
- Green badges = done

### Data Tips
- Use lot numbers like "LOT-YYYY-NNN" for easy tracking
- Add project references for cross-system linking
- Use status field to track workflow (Draft → Active → Closed)

### Security Tips
- Change demo passwords before production
- Don't commit passwords to Git
- Use HTTPS in production
- Enable CORS only for trusted domains

---

## 🎓 Learning Path

**If you have 15 minutes:**
1. This manual (OWNER'S MANUAL.md)
2. Run the app
3. Explore as different user roles

**If you have 1 hour:**
1. This manual
2. [ARCHITECTURE.md](./ARCHITECTURE.md) (System Overview)
3. [API.md](./API.md) (Endpoints Overview)
4. Run the app and test 2-3 workflows

**If you have half a day:**
1. All of above
2. [DATABASE.md](./DATABASE.md) - Database structure
3. [DEPLOYMENT.md](./DEPLOYMENT.md#local-development-deployment) - Local setup
4. [TESTING.md](./TESTING.md#manual-e2e-test-cases) - Test cases

**If you want to master it:**
1. Read all documentation
2. Study [ARCHITECTURE.md](./ARCHITECTURE.md) system design
3. Review [server.py](./server.py) source code
4. Understand [DATABASE.md](./DATABASE.md) relationships
5. Review [STANDARDS.md](./STANDARDS.md) for conventions
6. Build a custom report or feature

---

## 📝 Version Information

**Current Version:** 1.0.0

**Release Date:** April 2025

**Python Version:** 3.12+

**Components:**
- V1 (recommended): `/docs` - Traditional UI
- V2: `/v2/static` - Alternative build

**Database:** SQLite3 (`sample_tracking.db`)

---

## 🎯 Final Checklist

Before you start, make sure you have:

- [ ] Python 3.12+ installed
- [ ] Repository cloned/downloaded
- [ ] This manual bookmarked
- [ ] 5 minutes for quick start
- [ ] Email/chat support if needed

**You're ready to go!** 🚀

---

**Questions?** Check [DOCUMENTATION.md](./DOCUMENTATION.md) for what documentation exists and where to find what you need.

**Happy tracking!** 📦✨
