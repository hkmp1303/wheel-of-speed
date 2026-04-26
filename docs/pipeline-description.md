# Wheel of Speed - Pipeline Description

**Project:** Wheel of Speed
**Technology Stack:** .NET 8.0 Backend (C#), React Frontend (Vite), SignalR for real-time communication
**Version Control:** Git/GitHub
**CI/CD Platform:** GitHub Actions + Render
**Last Updated:** 2026-04-26

---

## Overview

This document describes the complete development and deployment pipeline for Wheel of Speed, a multiplayer word-guessing game. The pipeline automates building, testing, and deploying both backend and frontend components through continuous integration and continuous deployment practices.

---

## Pipeline Architecture

```
┌─────────────────┐
│  Code Changes   │
│  (Git Push/PR)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      GitHub Actions CI Pipeline         │
│  ┌─────────────┬──────────┬──────────┐  │
│  │  Backend    │ Frontend │ API Test │  │
│  │  Job        │ Job      │ Job      │  │
│  └─────┬───────┴────┬─────┴────┬─────┘  │
│        ▼            ▼          ▼        │
│  ┌────────────┐                         │
│  │   xUnit    │                         │
│  └─────┬──────┘                         │
│        ▼                                │
│  ┌─────────────────────────────────┐    │
│  │       E2E Tests Job             │    │
│  └──────────────┬──────────────────┘    │
└─────────────────┼───────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Artifacts     │
         │  (Test Reports)│
         └────────────────┘
                  │
                  ▼ (on feature/deploy branch)
         ┌────────────────┐
         │  Render Deploy │
         │  (Auto-Deploy) │
         └────────┬───────┘
                  │
         ┌────────┴──────────┐
         ▼                   ▼
┌─────────────────┐   ┌────────────────┐
│ Backend Service │   │ Frontend Site  │
│ (Docker/API)    │   │ (Static Vite)  │
└─────────────────┘   └────────────────┘
```

---

## Stages & Steps

### 1. **Code Commit** (Developer Trigger)

**Inputs:**
- Source code changes in local repository

**Actions:**
- Developer commits code to feature branch
- Push to GitHub repository

**Outputs:**
- Code pushed to remote repository
- Triggers CI pipeline

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

---

### 2. **Backend Job** (Parallel Execution)

**Environment:** `ubuntu-latest`
**Runtime:** .NET 8.0 SDK

**Steps:**

1. **Checkout Code**
   - Tool: `actions/checkout@v4`
   - Fetches latest repository code

2. **Setup .NET SDK**
   - Tool: `actions/setup-dotnet@v4`
   - Version: `8.0.x`
   - Installs .NET runtime and SDK

3. **Restore Dependencies**
   - Command: `dotnet restore wheel-of-speed.sln`
   - Downloads NuGet packages
   - Caching: Automatic via NuGet

4. **Build Application**
   - Command: `dotnet build wheel-of-speed.sln --no-restore --configuration Release`
   - Compiles C# code to binaries
   - Configuration: Release (optimized)

5. **Run Unit Tests**
   - Command: `dotnet test wheel-of-speed.sln --no-build --configuration Release`
   - Executes xUnit tests in `Testing/UnitTests/`
   - Tests: MatchEngine, InMemoryMatchService, Rematch logic, Timer behavior

**Outputs:**
- Compiled backend binaries
- Test results (pass/fail)
- Job completion status for dependent jobs

**Quality Gates:**
- All unit tests must pass
- Build must succeed without errors

---

### 3. **Frontend Job** (Parallel Execution)

**Environment:** `ubuntu-latest`
**Runtime:** Node.js 20
**Working Directory:** `frontend/`

**Steps:**

1. **Checkout Code**
   - Tool: `actions/checkout@v4`

2. **Setup Node.js**
   - Tool: `actions/setup-node@v4`
   - Version: `20`
   - Cache: `npm` (dependencies cached via `frontend/package-lock.json`)

3. **Install Dependencies**
   - Command: `npm install`
   - Installs: React, Vite, Playwright, Newman
   - Dependencies: @microsoft/signalr, react, react-dom

4. **Build Frontend**
   - Command: `npm run build`
   - Bundles React app using Vite
   - Output: Optimized static files in `frontend/dist/`

**Outputs:**
- Production-ready frontend build
- Static HTML, CSS, JavaScript bundles
- Job completion status for dependent jobs

**Quality Gates:**
- Build must complete without errors

---

### 4. **API Tests Job** (Sequential - depends on Backend)

**Environment:** `ubuntu-latest`
**Runtime:** .NET 8.0 + Node.js 20
**Working Directory:** `frontend/`

**Steps:**

1. **Checkout Code**
2. **Setup .NET SDK** (8.0.x)
3. **Setup Node.js** (20, with npm cache)

4. **Install Frontend Tooling**
   - Command: `npm ci` (clean install for CI)

5. **Start Backend Server**
   - Command: `dotnet run --project ../Server/WheelOfSpeed.Server.csproj --urls http://127.0.0.1:5000 &`
   - Runs backend in background
   - Port: 5000

6. **Wait for Backend Health**
   - Health Check Endpoint: `http://127.0.0.1:5000/api/health`
   - Retry Logic: 30 attempts with 2-second intervals (60 seconds max)
   - Validation: HTTP 200 response from health endpoint

7. **Run Newman API Tests**
   - Command: `npm run test:api`
   - Tool: Newman (Postman CLI)
   - Collection: `Testing/ApiTests/wheel-of-speed.postman_collection.json`
   - Environment: `Testing/ApiTests/local.postman_environment.json`
   - Tests: Match creation, joining, ready system, spin, guess endpoints

**Outputs:**
- API test results
- Request/response validation

**Quality Gates:**
- All API tests must pass
- Backend health check must succeed

---

### 5. **E2E Tests Job** (Sequential - depends on Backend & Frontend)

**Environment:** `ubuntu-latest`
**Runtime:** .NET 8.0 + Node.js 20
**Working Directory:** `frontend/`
**Browser:** Chromium

**Steps:**

1. **Checkout Code**
2. **Setup .NET SDK** (8.0.x)
3. **Setup Node.js** (20, with npm cache)

4. **Install Frontend Tooling**
   - Command: `npm ci`

5. **Install Playwright Browsers**
   - Command: `npx playwright install --with-deps chromium`
   - Installs: Chromium browser + system dependencies

6. **Run Playwright E2E Tests**
   - Command: `npm run test:e2e`
   - Config: `frontend/playwright.config.js`
   - Automatically starts:
     - Backend server (port 5000)
     - Frontend dev server (port 5173)
   - Tests:
     - Critical user flows
     - Match creation and joining
     - Lobby ready system
     - Gameplay interactions
     - SignalR real-time updates
     - Rematch functionality

7. **Upload Test Artifacts**
   - Tool: `actions/upload-artifact@v4`
   - Condition: Always (even on failure)
   - Artifacts:
     - `frontend/playwright-report` (HTML report)
   - Retention: GitHub default (90 days)

**Outputs:**
- E2E test results
- HTML test report
- Test traces for debugging failures

**Quality Gates:**
- All critical E2E flows must pass
- No test timeouts or crashes

---

## Test Coverage Matrix

| Test Type | Tool | Location | Coverage |
|-----------|------|----------|----------|
| **Unit Tests** | xUnit | `Testing/UnitTests/` | MatchEngine, Services, Game Logic |
| **API Tests** | Newman | `Testing/ApiTests/` | REST endpoints, Request/Response validation |
| **E2E Tests** | Playwright | `frontend/tests/` | User flows, UI interactions, SignalR |
| **BDD Tests** | (Pending) | `Testing/BDD/` | Feature specifications |

---

## Deployment Pipeline

### **Render Auto-Deploy** (Configured via `render.yaml`)

**Trigger:** Push to `feature/deploy` branch

#### **Backend Service (Web Service)**

**Configuration:**
- Type: Docker
- Dockerfile: `Server/Dockerfile`
- Health Check: `/api/health`
- Port: Dynamic (injected by Render via `$PORT` env var)
- Auto-Deploy: Enabled

**Build Process:**
1. Multi-stage Dockerfile build
2. Stage 1 (Build):
   - Base: `mcr.microsoft.com/dotnet/sdk:8.0`
   - Restore dependencies
   - Build and publish Release configuration
3. Stage 2 (Runtime):
   - Base: `mcr.microsoft.com/dotnet/aspnet:8.0`
   - Copy published artifacts
   - Configure ASPNETCORE_URLS with dynamic port

**Deployment Verification:**
- Health endpoint returns 200 OK
- Service accessible via Render URL

#### **Frontend Service (Static Site)**

**Configuration:**
- Type: Static Site
- Root Directory: `frontend/`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Environment Variables:
  - `VITE_API_BASE_URL`: Backend Render URL
- Auto-Deploy: Enabled

**Build Process:**
1. Clean install dependencies
2. Vite production build
3. Deploy static files from `dist/`

**Deployment Verification:**
- Frontend accessible
- API calls route to backend
- SignalR connection established

---

## Environment Specifications

### **Local Development**

**Backend:**
- URL: `http://127.0.0.1:5000`
- Run: `dotnet run` (from `Server/`)
- Or: `./run.sh` (starts both backend and frontend)

**Frontend:**
- URL: `http://127.0.0.1:5173`
- Run: `npm run dev` (from `frontend/`)
- Proxy: API calls proxied to backend via Vite config

**Database:**
- Current: In-memory (no persistence)
- Future: External database connection

---

### **CI Environment (GitHub Actions)**

**Runner:** `ubuntu-latest`
**Isolation:** Each job runs in fresh VM
**Networking:** Localhost communication between services
**Caching:**
- npm dependencies (via `package-lock.json` hash)
- NuGet packages (automatic)

---

### **Production (Render)**

**Backend:**
- Runtime: Docker container
- Base Image: `mcr.microsoft.com/dotnet/aspnet:8.0`
- Auto-scaling: Render managed
- HTTPS: Automatic (Render-provided SSL)

**Frontend:**
- Hosting: Static CDN
- HTTPS: Automatic
- Asset optimization: Vite production build

---

## Automation & Triggers

### **Automated Triggers**

| Event | Pipeline Action |
|-------|----------------|
| Push to `main` | Full CI pipeline (build, test) |
| Push to `develop` | Full CI pipeline (build, test) |
| Pull Request to `main`/`develop` | Full CI pipeline (build, test) |
| Push to `feature/deploy` | CI pipeline + Render auto-deploy |

### **Manual Triggers**

- Local testing: `npm run test:e2e`, `npm run test:api`, `dotnet test`, `./test.sh`
- Local development: `./run.sh` or individual `dotnet run` / `npm run dev`

---

## Dependencies Between Stages

```
backend ─────┐
             ├──→ api-tests ───┐
frontend ────┘                 ├──→ e2e-tests
                               │
                               ▼
                         Test Artifacts
```

**Execution Order:**
1. **Parallel:** `backend` + `frontend` jobs
2. **Sequential:** `api-tests` (after `backend` completes)
3. **Sequential:** `e2e-tests` (after `backend` AND `frontend` complete)

**Rationale:**
- API tests need backend server running
- E2E tests need both frontend build validated and backend available
- Parallel execution reduces total pipeline time

---

## Caching Strategy

### **npm Dependencies**
- **Cache Key:** Hash of `frontend/package-lock.json`
- **Cached Location:** `~/.npm`
- **Invalidation:** On `package-lock.json` changes
- **Benefit:** ~30-60 second reduction per job

### **NuGet Packages**
- **Cache:** Automatic via .NET tooling
- **Location:** NuGet global packages folder
- **Benefit:** Faster restore on unchanged dependencies

### **Playwright Browsers**
- **Not Cached:** Fresh browser install per run
- **Rationale:** Ensures latest browser version, minimal size impact

---

## Error Handling & Recovery

### **Build Failures**

**Backend Build Fails:**
- Pipeline stops (dependent jobs blocked)
- Notification: GitHub UI + optional email
- Resolution: Fix compilation errors, push new commit

**Frontend Build Fails:**
- E2E tests blocked
- API tests still run (no frontend dependency)

### **Test Failures**

**Unit Tests Fail:**
- Job marked as failed
- Test results available in GitHub Actions logs
- No retry mechanism (must fix code)

**API Tests Fail:**
- Backend startup timeout: 60 seconds max
- Test failure: Newman provides detailed request/response logs

**E2E Tests Fail:**
- Artifacts uploaded regardless (traces, screenshots, videos)
- HTML report available for download
- Traces can be viewed in Playwright Trace Viewer

### **Deployment Failures**

**Render Deploy Fails:**
- Automatic rollback to previous working version
- Health check prevents unhealthy deployments
- Logs available in Render dashboard

### **Retry & Rollback**

- **CI Retries:** None configured (manual re-run required)
- **E2E Test Retries:** 0 (configured in `playwright.config.js`)
- **Deployment Rollback:** Manual via Render dashboard

---

## Performance Considerations

### **Pipeline Execution Time**

**Typical Successful Run:**
- Backend job: ~2-3 minutes
- Frontend job: ~1-2 minutes
- API tests: ~3-4 minutes
- E2E tests: ~5-7 minutes
- **Total:** ~8-10 minutes (with parallel execution)

### **Optimization Strategies**

1. **Parallel Jobs:** Backend and frontend build simultaneously
2. **Dependency Caching:** npm cache saves ~60s per job
3. **Selective Testing:** Only critical E2E flows in CI
4. **Headless Browsers:** Faster than headed mode
5. **--no-build flag:** Reuses compiled binaries

### **Resource Usage**

- **GitHub Actions:** Free tier (2,000 minutes/month for public repos)
- **Render:** Free tier or paid (based on usage)
- **Storage:** Test artifacts retained for 90 days

---

## Security & Compliance

### **Current Security Measures**

1. **CORS Configuration:** Controlled in backend `Program.cs`
2. **HTTPS:** Enforced in production (Render automatic SSL)
3. **Health Checks:** Prevents deployment of unhealthy services
4. **Dependency Management:** npm + NuGet package managers

### **Planned Security Enhancements (DevSecOps)**

Per project requirements, future pipeline stages will include:

1. **Dependency Scanning**
   - Tool: Dependabot (GitHub native)
   - Frequency: Weekly
   - Action: Automated PR for updates

2. **Vulnerability Analysis**
   - SAST (Static Application Security Testing)
   - .NET Security Scanning
   - npm audit integration

3. **Secret Management**
   - GitHub Secrets for sensitive data
   - Environment-specific configurations
   - No secrets in source code

### **Access Control**

- **Pipeline Triggers:** Repository contributors only
- **Render Deployments:** Auto-deploy from `feature/deploy` branch
- **Manual Approvals:** Not currently configured

---

## Monitoring & Observability

### **Pipeline Monitoring**

**Available Metrics:**
- Build success/failure rate
- Test pass/fail trends
- Pipeline execution duration
- Artifact storage usage

**Visibility:**
- GitHub Actions UI (real-time logs)
- Badge in README (optional)
- Email notifications on failure (configurable)

### **Application Monitoring**

**Production:**
- Render health checks (`/api/health` endpoint)
- Render metrics dashboard
- Application logs via Render console

**Local Development:**
- Console logging
- Log files: `backend.log`, `frontend.log`

### **Test Reporting**

- **Unit Tests:** Console output in CI logs
- **API Tests:** Newman progress reporter
- **E2E Tests:** HTML report + trace viewer
- **Artifacts:** Downloadable from GitHub Actions

---

## Known Issues & Limitations

### **Current Gaps**

1. **No BDD Test Execution in CI**
   - BDD features exist in `Testing/BDD/` but not integrated
   - Decision pending on BDD framework choice

2. **No Frontend Component Tests**
   - No Vitest/Jest setup for React components
   - Candidates: GameContext, PrizeWheel, Scoreboard

3. **No Real SignalR Hub Test in CI**
   - SignalR tested only via E2E tests
   - No isolated hub unit tests in CI

4. **In-Memory State**
   - No database persistence
   - State lost on backend restart

5. **No Performance Testing**
   - Load testing not integrated
   - No metrics on concurrent users

### **Known Behavior**

- Backend startup in CI can take 30-60 seconds
- E2E tests are non-parallel (sequential execution)
- Render free tier has cold start delays (~30s)

---

## Future Enhancements

### **Short-Term**

1. Add dependency scanning to CI pipeline
2. Implement SAST security scanning
3. Add frontend component tests (Vitest)
4. Integrate BDD tests into CI
5. Add test coverage reporting

### **Medium-Term**

1. Database integration for persistent state
2. Multi-environment deployments (staging, production)
3. Performance/load testing stage
4. Automated semantic versioning
5. Release notes generation

### **Long-Term**

1. Blue-green deployments
2. Canary releases
3. Advanced monitoring (APM tools)
4. Automated rollback on metric thresholds
5. Multi-region deployment

---

## Runbook & Quick Commands

### **Local Development**

```bash
# Start both backend and frontend
./run.sh

# Backend only
dotnet run

# Frontend only
cd frontend && npm run dev
```

### **Local Testing**

```bash
# Run all unit tests
dotnet test wheel-of-speed.sln

# Run E2E tests
cd frontend && npm run test:e2e

# Run API tests
cd frontend && npm run test:api

# Run all tests (script)
./test.sh
```

### **Build Only**

```bash
# Full build (backend + frontend)
./build.sh

# Backend build
dotnet build wheel-of-speed.sln --configuration Release

# Frontend build
cd frontend && npm run build
```

### **CI/CD Commands**

```bash
# Trigger CI (via git)
git push origin main

# View pipeline status
# GitHub UI: Actions tab

# Re-run failed jobs
# GitHub UI: Re-run failed jobs button
```

---

## Contact & Ownership

**Pipeline Owners:** Development Team
**Repository:** [GitHub Repository URL]
**Documentation:** `docs/TESTING-PLAN.md`, `docs/PIPELINE-DESCRIPTION.md`
**Deployment Guide:** `DEPLOY_RENDER.md`

---

## Glossary

- **CI (Continuous Integration):** Automated build and test on every commit
- **CD (Continuous Deployment):** Automated deployment to production
- **E2E (End-to-End):** Full user flow testing
- **Newman:** CLI tool for running Postman collections
- **Playwright:** Browser automation for E2E testing
- **SignalR:** Real-time WebSocket communication library
- **Vite:** Fast frontend build tool
- **xUnit:** .NET testing framework
- **YAML:** Pipeline configuration language

---

**Document Version:** 1.0
**Last Review:** 2026-04-26
**Next Review:** As needed when pipeline changes
