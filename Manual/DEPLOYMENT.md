# Sample Tracking Deployment Guide

## Overview

Sample Tracking can be deployed in multiple configurations:
1. **Local Development** - Single developer machine
2. **Docker** - Containerized for portability
3. **Render.com** - Managed platform with persistent storage
4. **GitHub Pages + Backend** - Static frontend, remotely hosted API

---

## Prerequisites

### Required
- Python 3.12+ (for server.py)
- Git (for GitHub deployments)
- Docker (for containerized deployments)

### Optional
- Docker Hub account (for private image storage)
- Render.com account (for managed deployments)
- GitHub account (for Pages + CI/CD)

---

## Local Development Deployment

### Getting Started

```bash
# Clone or navigate to project directory
cd /Users/gowtham/Downloads/ABG_HILBGM/NPD

# No external dependencies required
python3 server.py
```

**Access:**
- **V1 (docs/):** http://127.0.0.1:8000
- **V1 Login:** http://127.0.0.1:8000/login.html
- **V2 (v2/static/):** http://127.0.0.1:8010

**Demo Users:**
```
admin / Admin@123
quality / Quality@123
logistics / Logistics@123
marketing / Marketing@123
```

### Development Workflow

1. **Edit code** - Python or JavaScript files
2. **Refresh browser** - No build step needed
3. **Database persists** - `sample_tracking.db` in project root

### Seed Demo Data

```bash
# First time setup with demo data
export SEED_DEMO_DATA=1
python3 server.py
```

### Reset Database

```bash
# Delete database to start fresh
rm sample_tracking.db

# Next startup recreates empty schema
python3 server.py
```

---

## Docker Deployment

### Build Image

```bash
# Build from Dockerfile
docker build -t sample-tracking:latest .

# Or tag with registry
docker build -t myregistry/sample-tracking:1.0.0 .
```

### Run Locally

```bash
# Start container with volume for data persistence
docker run -p 8000:8000 \
  -v $(pwd)/data:/var/data \
  sample-tracking:latest

# Or with temp storage (data lost on restart)
docker run -p 8000:8000 sample-tracking:latest
```

**Access:** http://localhost:8000

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    container_name: sample-tracking
    ports:
      - "8000:8000"
    volumes:
      - ./data:/var/data
    environment:
      - SEED_DEMO_DATA=1
    restart: unless-stopped

  # Optional: Backup service
  backup:
    image: alpine
    volumes:
      - ./data:/var/data
      - ./backups:/backups
    entrypoint: |
      /bin/sh -c "
      while true; do
        cp /var/data/sample_tracking.db /backups/sample_tracking.db.\$(date +%Y%m%d_%H%M%S)
        sleep 86400
      done
      "
```

**Start:**
```bash
docker-compose up -d
docker-compose logs -f app
docker-compose down
```

### Push to Docker Hub

```bash
# Tag with Docker Hub username
docker tag sample-tracking:latest username/sample-tracking:latest

# Login (one-time)
docker login

# Push
docker push username/sample-tracking:latest

# Pull on another machine
docker pull username/sample-tracking:latest
docker run -p 8000:8000 username/sample-tracking:latest
```

---

## Render.com Deployment

### Prerequisites
- GitHub account with this repository
- Render.com account
- Repository linked to Render

### Automatic Deployment

**File:** `render.yaml` (already included)

```yaml
services:
  - type: web
    name: sample-tracking
    env: docker
    plan: free
    autoDeploy: true
    disk:
      name: data
      mountPath: /var/data
      sizeGB: 1
    envVars:
      - key: SAMPLE_TRACKING_DB_PATH
        value: /var/data/sample_tracking.db
```

### Manual Deployment

1. **Create New Service**
   - Render.com Dashboard → New → Web Service
   - Select repository
   - Choose GitHub account

2. **Configure**
   - **Name:** sample-tracking
   - **Build Command:** (auto-detected from Dockerfile)
   - **Start Command:** python server.py
   - **Environment:** Python
   - **Plan:** Free (or paid)

3. **Add Disk**
   - Name: `data`
   - Mount path: `/var/data`
   - Size: 1GB

4. **Environment Variables**
   - `SEED_DEMO_DATA=1` (optional, first deploy only)
   - `CORS_ALLOW_ORIGINS=*` (for development) or specific origin

5. **Deploy**
   - Click Deploy
   - Wait for build (3-5 minutes)
   - Access at `https://<service-name>.onrender.com`

### Render Pricing

| Plan | Price/Month | vCPU | RAM | Benefits |
|------|-------------|------|-----|----------|
| Free | $0 | 0.5 | 512MB | Auto-spins down, slower |
| Starter | $7 | 0.5 | 512MB | Always on, priority queue |
| Standard | $25+ | 1.0 | 1GB | Reserved resources |

### Deploy via CLI

```bash
# Install Render CLI
npm install -g @render-com/render-cli

# Login
render login

# Deploy (from project directory)
render up
```

### GitHub Actions Auto-Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        run: |
          curl -X POST https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }} \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"
```

**Setup:**
1. Generate API key in Render Dashboard
2. Add to GitHub Secrets: `RENDER_API_KEY`
3. Add service ID to secrets: `RENDER_SERVICE_ID`

### Post-Deployment

**Verify:**
```bash
# Check logs
# Render Dashboard → Service logs

# Test API
curl https://<service-name>.onrender.com/api/session \
  -H "X-Auth-Token: invalid" \
  -H "Content-Type: application/json"

# Should return 401 Unauthorized
```

**Configure Frontend:**
```javascript
// docs/config.js
window.API_BASE_URL = "https://<service-name>.onrender.com";
```

**Enable CORS (if Frontend Separate):**
In Render Dashboard → Environment:
```
CORS_ALLOW_ORIGINS=https://yourfrontend.com
```

---

## GitHub Pages Frontend Deployment

### Setup GitHub Pages

1. **Enable in Repository Settings**
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/docs`
   - Save

2. **Frontend Hosted At**
   - `https://<username>.github.io/<repo-name>/`

### Configure API Endpoint

**File:** `docs/config.js`

```javascript
// Development (API same-origin)
window.API_BASE_URL = "";

// Production (API on Render)
window.API_BASE_URL = "https://sample-tracking.onrender.com";
```

### CORS Configuration

In backend (Render), set environment variable:

```
CORS_ALLOW_ORIGINS=https://<username>.github.io
```

### Deploy:

```bash
# Push to GitHub
git add docs/config.js
git commit -m "Configure API endpoint"
git push origin main

# GitHub Pages auto-builds
# Access at https://<username>.github.io/<repo-name>/
```

---

## AWS ECS Deployment

### Build and Push to ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name sample-tracking --region us-east-1

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push image
docker tag sample-tracking:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/sample-tracking:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/sample-tracking:latest
```

### Create ECS Task Definition

```json
{
  "family": "sample-tracking",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "sample-tracking",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/sample-tracking:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SEED_DEMO_DATA",
          "value": "1"
        }
      ],
      "mountPoints": [
        {
          "containerPath": "/var/data",
          "sourceVolume": "efs"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sample-tracking",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "volumes": [
    {
      "name": "efs",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-xxxxx",
        "transitEncryption": "ENABLED"
      }
    }
  ]
}
```

### Create ECS Service

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster default \
  --service-name sample-tracking \
  --task-definition sample-tracking:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration awsvpcConfiguration={subnets=[subnet-xxxxx],assignPublicIp=ENABLED,securityGroups=[sg-xxxxx]}
```

---

## Kubernetes Deployment

### Build and Push Docker Image

```bash
docker build -t sample-tracking:1.0.0 .
docker tag sample-tracking:1.0.0 gcr.io/project-id/sample-tracking:1.0.0
docker push gcr.io/project-id/sample-tracking:1.0.0
```

### Kubernetes Manifests

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-tracking
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sample-tracking
  template:
    metadata:
      labels:
        app: sample-tracking
    spec:
      containers:
      - name: sample-tracking
        image: gcr.io/project-id/sample-tracking:1.0.0
        ports:
        - containerPort: 8000
        env:
        - name: SEED_DEMO_DATA
          value: "0"
        - name: CORS_ALLOW_ORIGINS
          value: "*"
        volumeMounts:
        - name: data
          mountPath: /var/data
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: sample-tracking-pvc

---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: sample-tracking-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8000
  selector:
    app: sample-tracking

---
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: sample-tracking-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

### Deploy

```bash
kubectl apply -f pvc.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Verify
kubectl get pods
kubectl get svc sample-tracking-service
```

---

## Production Hardening Checklist

### Security
- [ ] Change demo passwords or remove hardcoded credentials
- [ ] Implement proper authentication (OAuth2, SAML)
- [ ] Enable HTTPS/TLS
- [ ] Set secure CORS headers
- [ ] Rate limiting
- [ ] Input validation/sanitization
- [ ] SQL injection protection (already using parameterized queries ✓)
- [ ] CSRF protection
- [ ] Audit logging

### Performance
- [ ] Database indexing
- [ ] Caching layer (Redis)
- [ ] CDN for static assets
- [ ] Load balancing
- [ ] Connection pooling
- [ ] Query optimization

### Operations
- [ ] Automated backups
- [ ] Health checks/monitoring
- [ ] Alerting
- [ ] Log aggregation
- [ ] Error tracking (Sentry)
- [ ] APM instrumentation
- [ ] Configuration management
- [ ] Secrets management (HashiCorp Vault, AWS Secrets Manager)

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load testing
- [ ] Security testing (OWASP)
- [ ] Penetration testing

### Compliance
- [ ] Data privacy (GDPR, CCPA)
- [ ] Data retention policies
- [ ] Encryption (in transit, at rest)
- [ ] Access controls (RBAC)
- [ ] Audit trails
- [ ] Incident response plan

---

## Monitoring & Logging

### Application Logs

**Render.com:**
- Dashboard → Logs tab
- 30-day retention

**Local Docker:**
```bash
docker logs -f sample-tracking
```

**Kubernetes:**
```bash
kubectl logs deployment/sample-tracking -f
```

### Health Checks

```bash
# Basic connectivity
curl https://your-app.com/

# API availability
curl https://your-app.com/api/session \
  -H "X-Auth-Token: invalid" \
  -w "\nStatus: %{http_code}\n"

# Database connectivity (create test endpoint)
curl https://your-app.com/api/health
```

### Recommended Monitoring Stack

- **Metrics:** Prometheus + Grafana
- **Logs:** ELK Stack or Datadog
- **Errors:** Sentry
- **APM:** New Relic or DataDog
- **Uptime:** Pingdom or StatusPageIO

---

## Rollback Procedures

### Render.com

```bash
# View deployment history
# Dashboard → Deployments

# Rollback to previous version
# Click "Redeploy" on older deployment
```

### Docker Hub

```bash
# Deploy previous image tag
docker run -p 8000:8000 username/sample-tracking:1.0.0
```

### Kubernetes

```bash
# View rollout history
kubectl rollout history deployment/sample-tracking

# Rollback to previous version
kubectl rollout undo deployment/sample-tracking

# Rollback to specific revision
kubectl rollout undo deployment/sample-tracking --to-revision=2
```

### GitHub

```bash
# Revert commit
git revert <commit-hash>
git push origin main

# Or force push to previous state (risky!)
git reset --hard <commit-hash>
git push -f origin main
```

---

## Database Backup & Recovery

### Local Backup

```bash
# Manual backup
cp sample_tracking.db sample_tracking.db.backup

# SQL export
sqlite3 sample_tracking.db ".dump" > backup.sql
```

### Render.com Backup

```bash
# Connect to mounted disk via download
# Render Dashboard → Disks → Download

# Or SSH into container and export
# Note: Render doesn't provide direct SSH for free tier
```

### AWS Backup

```bash
# EBS snapshot
aws ec2 create-snapshot --volume-id vol-xxxxx

# Or database replication to RDS
```

### Backup Automation

```bash
# Cron job (Linux/Mac)
0 2 * * * cp /var/data/sample_tracking.db /backups/sample_tracking.db.$(date +\%Y\%m\%d)

# Or Docker backup service (see docker-compose example)
```

---

## Cost Optimization

### Render.com

- **Free tier:** $0/month (auto-spins down, slow)
- **Starter:** $7/month (always on, faster)
- Use free for development/demo
- Upgrade to starter for production

### Docker Hub

- **Free:** 1 private repo
- **Pro:** $5/month, unlimited private repos

### AWS

- **EC2:** t3.micro (1 year free) or t4g.small ($8.76/month)
- **RDS:** db.t3.micro (1 year free)
- **Storage:** EBS at $0.10/GB/month

### Cost Saving Tips

1. Use free tier services for dev
2. Turn off services when not in use
3. Implement auto-scaling
4. Monitor usage regularly
5. Use spot instances (AWS)
6. Implement caching
7. Optimize database queries
8. Use CDN for static assets

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [API.md](./API.md) - API endpoints
- [DATABASE.md](./DATABASE.md) - Database schema
- [TESTING.md](./TESTING.md) - Testing guide
- README.md - Quick start
