# Deploy on Render (Plug and Play)

This project is prepared for a low-refactor Render setup with two services:
- Backend API as a Docker Web Service
- Frontend as a Static Site

## 1) Access prerequisites (private repository)

You can proceed even as contributor, but only if Render can access the private repository.

Checklist for repo owner/admin:
1. Open Render and connect GitHub.
2. Grant Render GitHub App access to this private repository.
3. Confirm you can see the repository from Render when creating services.

If the repo is not visible in Render, this is an access issue, not a code issue.

## 2) What is already prepared in this branch

- Backend Dockerfile: [Server/Dockerfile](Server/Dockerfile)
- Render blueprint: [render.yaml](render.yaml)
- Frontend Render env example: [frontend/.env.render.example](frontend/.env.render.example)
- Frontend uses `VITE_API_BASE_URL` for both API calls and SignalR hub URL.

## 3) Create backend service (Web Service)

In Render:
1. New + -> Web Service
2. Select repository
3. Branch: `feature/deploy` (or `main` later)
4. Runtime: Docker
5. Root Directory: project root
6. Dockerfile Path: `Server/Dockerfile`
7. Health Check Path: `/api/health`
8. Auto Deploy: On

Expected result:
- Service starts
- Health check turns green
- You get a URL like `https://wheel-of-speed-api.onrender.com`

## 4) Create frontend service (Static Site)

In Render:
1. New + -> Static Site
2. Select same repository
3. Branch: `feature/deploy` (or `main` later)
4. Root Directory: `frontend`
5. Build Command: `npm ci && npm run build`
6. Publish Directory: `dist`
7. Add environment variable:
   - `VITE_API_BASE_URL` = backend Render URL from step 3

Expected result:
- Frontend deploys and can call backend API
- SignalR connects to backend hub

## 5) Validate end-to-end after first deploy

1. Open frontend URL.
2. Create a match.
3. Join from second browser/incognito.
4. Confirm lobby updates and gameplay events are live.
5. Confirm backend health endpoint works: `/api/health`.

## 6) CI/CD approach without secrets

For now you can rely on Render Auto Deploy from branch pushes.
- No GitHub deploy hook required.
- No GitHub secrets required for deployment trigger.

Later, if you want deploys initiated by GitHub Actions, add Render deploy hook URL as a GitHub secret.

## 7) Known behavior

- Backend CORS is currently permissive to keep deployment friction low.
- Static frontend and API are hosted on different Render domains.
- If owner/admin changes access permissions, service creation may fail until access is re-granted.
