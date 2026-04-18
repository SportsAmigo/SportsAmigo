# SportsAmigo: Switch Render Backend from Node Runtime to Docker

This guide explains:
- Whether Docker code is already present in this project
- What Render does automatically vs what you must provide
- Exact step-by-step actions in Render, Vercel, and Atlas

## 1) Is Docker code needed, and is it auto-created by Render?

Short answer:
- Yes, Docker code is needed.
- No, Render does not automatically write your Dockerfile.

Render can build and run Docker images, but you must provide Docker-related files in your repo.

The "10-15 lines" idea is not a strict rule. Dockerfile length depends on your app. Some are 8 lines, some 30+ lines.

## 2) Is Docker code already present in this repo?

Yes. You already have Docker setup files.

### Backend Docker files
- backend/Dockerfile
- backend/.dockerignore

### Frontend Docker files
- frontend/Dockerfile
- frontend/.dockerignore

### Local multi-service Docker (for local dev/testing)
- docker-compose.yml

Important:
- For Render backend deployment, the key file is backend/Dockerfile.
- docker-compose.yml is mainly for local multi-container runs. Render Web Service does not run your full compose stack.

## 3) What is inside current backend Dockerfile (already done)

Current backend Dockerfile does this:
1. Uses node:18-alpine image
2. Sets /app as working directory
3. Copies package files
4. Installs production dependencies
5. Copies backend source
6. Exposes port 5000
7. Starts server.js

So yes, Docker code for backend is already done.

## 4) Step-by-step: Switch Render service from Node runtime to Docker

Best practice is blue-green migration (safe switch):
- Keep old Node service running
- Create new Docker service
- Test
- Cut over traffic
- Then delete old service

### Step A: Prepare
1. Open current Render backend service.
2. Copy all environment variables from it.
3. Confirm your backend uses Render's injected port in code:
   - Ensure server startup is based on `process.env.PORT || 5000`.
   - In this repo, this is already implemented in `backend/server.js`.
4. Keep these ready for new Docker service:
   - NODE_ENV=production
   - MONGO_URI (Atlas connection string)
   - REDIS_URL (use a managed Redis URL; do not rely on localhost in Render production)
   - SESSION_SECRET
   - FRONTEND_URL (your Vercel domain). Double-check your Express CORS middleware reads this value so the new Docker backend accepts frontend requests.
   - Payment/email keys (Razorpay, Resend, etc.)
5. Decide upload persistence before cutover:
   - If user-uploaded files matter in production, do one of these before go-live:
   - Use object storage (S3/Cloudinary/R2), or
   - Attach a Render persistent disk and keep upload path mapped to that storage.
   - Reason: container filesystem is ephemeral after restart/redeploy.

Do not manually set PORT unless you have a special reason. Render injects PORT automatically.

### Step B: Create new Docker Web Service in Render
1. Render Dashboard -> New -> Web Service.
2. Select same Git repo and branch.
3. Environment: Docker.
4. Root Directory: backend.
5. Dockerfile Path: Dockerfile.
6. Set region and instance type.
7. Health Check Path: /health (or /api/health).
8. Create Web Service.

### Step C: Configure environment variables
1. Open newly created Docker service -> Environment.
2. Add all vars copied from old service.
3. Ensure REDIS_URL points to a reachable managed Redis instance.
4. Save.
5. Trigger deploy if not auto-triggered.

### Step D: Validate new Docker service
1. Wait for deploy success and no startup errors.
2. Open health endpoint.
3. Test login/session flow.
4. Test one protected API endpoint.
5. Test payment/email route if applicable.
6. Confirm CORS works from Vercel frontend.
7. Check logs for Redis connection readiness and verify at least one cache-enabled endpoint behaves normally.
8. Test one file upload flow, then restart/redeploy once and confirm file persistence based on your chosen storage approach.

### Step E: Cutover
You have two options:

Option 1 (quick):
1. Update frontend env in Vercel: REACT_APP_API_URL = new Docker Render URL
2. Trigger a fresh Vercel deployment/build so the React app rebuilds with the new value (changing the env var alone is not enough)
3. Verify app
4. Stop old Node service

Option 2 (clean/stable):
1. Attach same custom API domain to new Docker service
2. Update DNS to point to new Docker service
3. Keep Vercel env unchanged
4. Verify app
5. Stop old Node service

## 5) Do you need changes in Vercel or Atlas?

### Vercel
- Needed only if backend URL changes.
- If API domain remains same, no Vercel change needed.
- If API domain changes, update REACT_APP_API_URL and redeploy.

### Atlas
- Usually no change needed.
- Same MONGO_URI can be reused.
- Check Atlas network access only if your setup uses strict IP allowlist.

## 6) Is code change required in this repository for the switch?

For this switch itself, usually no code change is required because backend Dockerfile already exists.

You only need:
- Render service migration/config change
- Environment variable copy
- Upload persistence infrastructure decision (object storage or Render persistent disk)
- Optional Vercel API URL update

## 7) Quick checklist

- [ ] backend/Dockerfile exists (yes)
- [ ] backend/.dockerignore exists (yes)
- [ ] New Docker service created in Render
- [ ] Env vars copied to new Docker service
- [ ] REDIS_URL set to managed Redis and validated in logs
- [ ] Upload persistence strategy chosen (object storage or Render persistent disk)
- [ ] Health check set to /health or /api/health
- [ ] New service tested end-to-end
- [ ] Upload + Redis behavior verified after deployment
- [ ] Vercel API URL updated only if backend URL changed
- [ ] Old Node service removed only after successful verification

## 8) Rollback plan

If anything breaks after cutover:
1. Point frontend back to old backend URL (or switch DNS back).
2. Keep old Node service running until issue is fixed.
3. Review Render logs in new Docker service and fix env/config mismatch.

