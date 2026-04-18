# SportsAmigo Final Website Setup Steps (After Code Changes)

This file is only for external setup websites and deployment dashboard actions.

Use this after pulling the new code changes.

## 0) Before website setup

1. Ensure latest backend code is pulled.
2. In backend folder run:
   - npm install
3. Confirm these files exist in your repo:
   - backend/config/cloudinary.js
   - backend/middleware/uploadCloudinary.js
   - backend/config/solr.js
   - backend/services/searchService.js
   - backend/services/solrIndexService.js
   - backend/scripts/reindex-solr.js
4. Commit and push your branch so Render deploys from latest code.

---

## 1) Cloudinary website setup (must do first)

1. Open cloudinary.com and log in.
2. Create or select your product environment.
3. From Cloudinary Dashboard, copy:
   - Cloud name
   - API key
   - API secret
4. Open Media Library and define upload folder path:
   - sportsamigo/profile
5. In Upload/Security settings:
   - Keep allowed formats: jpg, jpeg, png, webp, gif
   - Keep max file size around 5MB policy
   - Keep credentials private (do not commit in code)

## 2) Render environment setup for Cloudinary

1. Open Render dashboard.
2. Open your backend service.
3. Go to Environment tab.
4. Add/update:
   - CLOUDINARY_CLOUD_NAME=<value from Cloudinary>
   - CLOUDINARY_API_KEY=<value from Cloudinary>
   - CLOUDINARY_API_SECRET=<value from Cloudinary>
   - CLOUDINARY_FOLDER=sportsamigo/profile
   - MAX_PROFILE_IMAGE_BYTES=5242880
5. Save environment variables.
6. Trigger deploy (or wait for auto-deploy).

## 3) Validate Cloudinary in production

1. Login as organizer and upload profile image.
2. Login as manager and upload profile image.
3. Login as player and upload profile image.
4. Verify image URL is Cloudinary URL (https://res.cloudinary.com/...)
5. Redeploy backend once and verify uploaded image still works.

If URL still shows /uploads/profile/...:
- Cloudinary env vars are not fully configured, and fallback local storage is active.

---

## 4) Solr hosting website setup

Choose one path.

Path A: Managed Solr provider
1. Create account in your Solr provider.
2. Create deployment in same region as Render backend (or nearest region).
3. Create collections/cores:
   - events
   - teams
4. Enable authentication and create credentials.
5. Copy endpoint URL.
6. Configure network access to allow Render backend.
7. Ensure HTTPS/TLS is enabled.

Path B: Self-hosted Solr
1. Provision VM/container host.
2. Install Solr.
3. Create collections/cores:
   - events
   - teams
4. Put HTTPS reverse proxy in front (example: Nginx).
5. Enable auth.
6. Restrict inbound access to backend origin/IP/network.

---

## 5) Render environment setup for Solr

1. Open Render backend service -> Environment.
2. Add/update:
   - ENABLE_SOLR_SEARCH=false
   - SOLR_BASE_URL=<your solr base url, no trailing slash preferred>
   - SOLR_USERNAME=<if used>
   - SOLR_PASSWORD=<if used>
   - SOLR_EVENT_COLLECTION=events
   - SOLR_TEAM_COLLECTION=teams
   - SOLR_TIMEOUT_MS=1500
3. Save environment variables.
4. Redeploy backend.

Keep ENABLE_SOLR_SEARCH=false until indexing is done.

---

## 6) Index Solr data (first load)

Run reindex against production environment.

Option A: From Render Shell/one-off job for backend service
1. Open backend service shell/job console.
2. Run:
   - npm run reindex:solr
3. Wait for logs:
   - Reindexed events: <number>
   - Reindexed teams: <number>

Option B: Run in a trusted environment with same env vars
1. Ensure backend env vars point to production Solr.
2. Run script:
   - npm run reindex:solr

Then verify in Solr admin UI that both collections have documents.

---

## 7) Enable Solr search gradually

1. In Render env set:
   - ENABLE_SOLR_SEARCH=true
2. Save and redeploy.
3. Test high-traffic pages:
   - Player browse events search
   - Player team search endpoint
   - Manager browse events search
4. Watch backend logs for fallback warnings:
   - If Solr fails, service falls back to Mongo search.

---

## 8) Post-enable validation checklist

1. Search results are returned for common keywords.
2. No API 500 spikes in Render logs.
3. Response times are acceptable for target endpoints.
4. Uploads continue to work with Cloudinary URLs.
5. No broken profile images after restart/redeploy.

---

## 9) Ongoing website operations

Cloudinary:
1. Monitor storage/bandwidth usage.
2. Rotate API keys periodically.
3. Optionally clean old assets if users replace photos often.

Solr:
1. Monitor query latency and error rates.
2. Keep a periodic reindex schedule (nightly or event-driven).
3. Rotate Solr credentials and update Render env.
4. Keep ENABLE_SOLR_SEARCH flag for safe rollback.

---

## 10) Quick rollback steps

If Solr causes issues:
1. Set ENABLE_SOLR_SEARCH=false in Render.
2. Redeploy backend.
3. App continues using fallback Mongo/Atlas search.

If Cloudinary upload fails:
1. Verify Cloudinary env vars in Render.
2. Redeploy backend.
3. Temporary fallback local upload may work, but Cloudinary setup should be corrected for persistence.
