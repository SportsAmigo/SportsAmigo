# Utility Scripts

This folder contains one-time utility scripts, database seeders, and migration files.

## Database Seeders
- **seedShop.js** - Populate shop items in database
- **seedWallet.js** - Initialize wallet transactions

## Admin Utilities
- **create-admin-user.js** - Create admin user account

## Database Migrations/Fixes
- **fix-confirm-teams.js** - Fix team confirmation issues (legacy)
- **migrate-verify-existing-users.js** - Verify user data migration (legacy)
- **quick-fix-all-teams.js** - Batch team fix (legacy)
- **super-simple-fix.js** - Simple data fix (legacy)

## Testing
- **test-schedule-flow.js** - Test match scheduling workflow

## Usage

Run any script from the backend directory:
```bash
cd backend
node scripts/create-admin-user.js
node scripts/seedShop.js
```

**Note:** These are utility scripts, not part of the main application. The main application runs from `server.js`.
