# SportsAmigo: Cloudinary Uploads and Solr Search Implementation Guide

This guide is only for these 2 enhancements:
1. Move file uploads to Cloudinary
2. Add Solr search optimization only on high-traffic pages

## Current project status (checked)

- Cloudinary integration: not present in backend.
- Solr integration: not present in backend.
- Existing search baseline already exists:
  - Atlas Search toggle and fallback logic in backend/models/shopItem.js and backend/models/event.js
   - Search endpoints already used by frontend pages (player event and team discovery)

So both requested enhancements need new implementation.

---

## Part A: Implement Cloudinary for file uploads

## A1) Decide upload strategy and scope

Use Cloudinary for user profile images first (manager, player, organizer profile updates).

Current upload routes to migrate:
- backend/routes/organizer-api.js
- backend/routes/organizer.js
- backend/routes/manager.js
- backend/routes/player.js

Current behavior stores files on local disk path and saves relative path in DB. Replace that with Cloudinary secure URL storage.

## A1.1) What you must do on Cloudinary website (outside code)

1. Go to cloudinary.com and create an account.
2. Open Cloudinary Console and create/select your product environment.
3. From Dashboard, copy:
   - Cloud name
   - API Key
   - API Secret
4. In Media Library settings, create folder naming plan:
   - sportsamigo/profile
5. In Security settings:
   - Keep API secret private.
   - Restrict API key usage by backend only.
6. In Upload settings:
   - Keep only image formats you allow (jpg, jpeg, png, webp, gif).
   - Keep file size limit policy aligned with backend (5MB).
7. In Render backend service env vars, add:
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
   - CLOUDINARY_FOLDER=sportsamigo/profile

## A2) Add dependencies

In backend:
1. Install Cloudinary SDK.
2. Keep multer for multipart handling.

Suggested packages:
- cloudinary

## A3) Add environment variables

In Render backend service environment:
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- CLOUDINARY_FOLDER=sportsamigo

Keep secrets only in Render env, never in source code.

## A4) Create Cloudinary config module

Create backend/config/cloudinary.js with:
1. Cloudinary client initialization from env vars.
2. Export configured cloudinary instance.

## A5) Create reusable upload middleware

Create backend/middleware/uploadCloudinary.js with:
1. Multer middleware for upload handling.
2. Cloudinary upload_stream integration for image upload.
3. Allowed image formats (jpg, jpeg, png, webp, gif if needed).
4. File size limits.
5. Folder naming convention, for example:
   - sportsamigo/profile
6. Export multer middleware:
   - uploadProfileImage = upload.single('profile_image')

## A6) Update profile routes to use Cloudinary middleware

For each profile update route in:
- backend/routes/organizer-api.js
- backend/routes/organizer.js
- backend/routes/manager.js
- backend/routes/player.js

Do this:
1. Replace local disk multer middleware with shared Cloudinary upload middleware.
2. Where code currently sets profile image like /uploads/profile/<filename>, replace with Cloudinary URL from req.file.path or req.file.secure_url (depends on adapter output).
3. Save Cloudinary URL directly into user profile_image field.
4. Optional but recommended: also store cloudinary public_id in DB for future delete/replace.

## A7) Optional cleanup behavior on image replacement

When user uploads a new profile image:
1. Read old image URL/public_id.
2. If it belongs to your Cloudinary folder, delete old asset using Cloudinary API.
3. Save new URL/public_id.

This avoids orphan image buildup.

## A8) Keep compatibility for old local image URLs

During migration, existing DB may contain local paths (/uploads/profile/...).

Do this:
1. Keep current static route temporarily so old URLs still load.
2. New uploads should use Cloudinary URL.
3. Optional later: run one-time migration script to re-upload old local images and update DB URLs.

## A9) Validate Cloudinary upload end to end

Test checklist:
1. Upload profile image as organizer.
2. Upload profile image as manager.
3. Upload profile image as player.
4. Confirm DB stores full https Cloudinary URL.
5. Confirm image persists after backend restart/redeploy.
6. Confirm old local image records still render (temporary compatibility).

## A10) Render deployment notes for Cloudinary

No Dockerfile change is required for Cloudinary.

Only required changes:
- backend code modules and route updates
- Cloudinary env vars in Render

---

## Part B: Implement Solr search optimization (only for high-traffic pages)

Important note:
- You already have Atlas Search support in code.
- Solr should be introduced only where it gives clear value.

Recommended high-traffic targets first (excluding shop search):
1. Player browse events search:
   - frontend/src/pages/player/BrowseEvents.jsx
   - backend/routes/player.js (api/events/search)
2. Player browse teams search:
   - frontend/src/pages/player/BrowseTeams.jsx
   - backend/routes/player.js (api/teams/search)
3. Manager browse events search:
   - frontend/src/pages/manager/BrowseEvents.jsx
   - backend/routes/manager.js (browse-events, add server-side search support)

Do not add Solr to all pages initially.

## B1) What you must do on Solr hosting website (outside code)

Choose one hosting path.

Option A (managed Solr provider website):
1. Create account in your Solr hosting provider.
2. Create deployment/cluster in the same region as Render backend.
3. Create cores/collections:
   - events
   - teams
4. Configure auth credentials (basic auth or token).
5. Copy endpoint URL and credentials.
6. Allow incoming traffic from Render backend (IP allowlist or network rule, based on provider model).
7. Enable TLS/HTTPS endpoint only.

Option B (self-hosted Solr):
1. Provision a VM/container host.
2. Install Solr and create cores:
   - events
   - teams
3. Put reverse proxy with HTTPS in front (for example Nginx).
4. Enable auth (basic auth or gateway auth).
5. Restrict inbound access to Render backend origin/IP.

In either path, keep an admin user for indexing and a read user for search if provider supports role separation.

## B2) Add Solr environment variables in Render

In Render backend service:
- ENABLE_SOLR_SEARCH=false (start disabled)
- SOLR_BASE_URL
- SOLR_USERNAME (if secured)
- SOLR_PASSWORD (if secured)
- SOLR_EVENT_COLLECTION=events
- SOLR_TEAM_COLLECTION=teams
- SOLR_TIMEOUT_MS=1500

Keep feature flag off until indexing and testing are complete.

## B3) Add Solr client module

Create backend/config/solr.js:
1. Solr HTTP client setup with timeout.
2. Helpers for query, update, delete, and commit.
3. Graceful error handling.

## B4) Define Solr document schema

events document fields:
- id
- title
- description
- location
- sport_type
- status
- event_date
- registration_deadline
- organizer_id
- updated_at

teams document fields:
- id
- name
- description
- sport_type
- manager_id
- current_members
- max_members
- status
- updated_at

Use text fields for relevance and faceting fields where needed.

## B5) Build indexing pipeline

Create:
- backend/services/solrIndexService.js
- backend/scripts/reindex-solr.js

Implement:
1. Full reindex script for events and teams.
2. Delta update functions called on create/update/delete in corresponding models.
3. Retry logic and structured logs for failed index operations.

## B6) Add search service with fallback

Create backend/services/searchService.js:
1. If ENABLE_SOLR_SEARCH=true, query Solr for targeted endpoints.
2. If Solr fails or times out, fallback to existing Atlas/Mongo search logic.
3. Return searchMeta showing engine used (solr or fallback).

This guarantees stability during rollout.

## B7) Wire only selected endpoints

Update only these API paths first:
1. /api/player/api/events/search
2. /api/player/api/teams/search
3. /api/manager/browse-events (add query param search and Solr path)

Do not modify unrelated pages.

## B8) Add pagination and query guards on Solr-backed endpoints

For targeted endpoints:
1. Add page and limit params.
2. Enforce sane max limit (for example 50).
3. Validate and sanitize user query input.
4. Keep existing Redis cache middleware for hot read endpoints where appropriate.

## B9) Frontend changes for targeted pages

Player Browse Events and Player Browse Teams first:
1. Add debounced input (300-500ms) before firing search API.
2. Send page and limit params.
3. Show loading state and no-results state.
4. Read searchMeta from response for diagnostics (optional hidden debug info).

Manager Browse Events:
1. Move current in-memory filtering to server-side search query.
2. Pass search text and page/limit from frontend.
3. Render paginated server results.

## B10) Test plan for Solr rollout

Functional tests:
1. Exact match search.
2. Partial term search.
3. Typo tolerance behavior (if configured).
4. Sport/filter combinations.
5. Pagination consistency.

Resilience tests:
1. Turn off Solr temporarily and verify fallback works.
2. Verify API still responds with fallback engine.
3. Validate response times under load for target endpoints.

## B11) Rollout plan (safe)

Phase 1:
1. Implement code + indexing + feature flag off.
2. Run full reindex.
3. Validate with internal testing.

Phase 2:
1. Enable Solr in staging.
2. Compare relevance and latency vs existing search.

Phase 3:
1. Enable Solr in production for player events search.
2. Monitor error rate and latency.

Phase 4:
1. Enable Solr for player teams search.
2. Then enable manager browse events search.
3. Expand only if metrics justify it.

## B12) Ongoing operations you must do outside code

1. In Solr hosting dashboard, monitor query latency, error rate, and index size.
2. Set alerts for high 5xx rate and slow query thresholds.
3. Schedule reindex job (nightly or incremental trigger based on updates).
4. Rotate Solr credentials and update Render env vars safely.
5. Keep Solr schema changes versioned and deployed via change process.

## B13) Docker and switch impact

- No backend Dockerfile change is required for Cloudinary or Solr.
- Required updates are code + environment + external service setup.
- In Render Docker switch checklist, include:
  1. Cloudinary env vars configured.
  2. Solr env vars configured (if enabling Solr now).
  3. Feature flag strategy confirmed before go-live.

---

## Quick implementation order (recommended)

1. Implement Cloudinary first (immediate durability win for uploads).
2. Deploy and validate uploads across all roles.
3. Implement Solr infrastructure and indexing.
4. Enable Solr for player events search first.
5. Expand to player teams search, then manager browse-events after metrics confirm improvement.

This keeps risk low and gives measurable performance gains where traffic is highest.
