const fs = require('fs');
const path = require('path');

const adminFile = path.join(__dirname, '../routes/admin.js');
let content = fs.readFileSync(adminFile, 'utf8');

// Find where module.exports is and insert before it
const exportIdx = content.lastIndexOf('module.exports = router;');
if (exportIdx === -1) {
    console.error('Could not find module.exports in admin.js');
    process.exit(1);
}

const newRoutes = `
// ============================================================
// NEW ROUTES — Admin Dashboard Expansion (Phase 1-5)
// ============================================================

// Generic user detail by ID (works for all roles)
router.get('/api/users/:id', async (req, res) => {
  try {
    const userDetails = await adminController.getUserDetailsById(req.params.id);
    return res.json({ success: true, data: userDetails });
  } catch (err) {
    console.error('Error getting user details:', err);
    return res.status(404).json({ success: false, message: err.message || 'User not found' });
  }
});

// Generic user delete by ID (any role)
router.delete('/users/any/:id', async (req, res) => {
  try {
    const UserSchemaModel = require('../models/schemas/userSchema');
    const userExists = await UserSchemaModel.findById(req.params.id);
    if (!userExists) return res.status(404).json({ success: false, message: 'User not found' });
    await User.deleteUser(req.params.id);
    return res.json({ success: true, message: userExists.role + ' deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Coordinator detail by ID
router.get('/api/coordinators/:id', async (req, res) => {
  try {
    const details = await adminController.getUserDetailsById(req.params.id);
    return res.json({ success: true, data: details });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message || 'Coordinator not found' });
  }
});

// Delete coordinator
router.delete('/users/coordinator/:id', async (req, res) => {
  try {
    const UserSchemaModel = require('../models/schemas/userSchema');
    const user = await UserSchemaModel.findById(req.params.id);
    if (!user || (user.role !== 'coordinator' && user.role !== 'moderator'))
      return res.status(404).json({ success: false, message: 'Coordinator not found' });
    await User.deleteUser(req.params.id);
    return res.json({ success: true, message: 'Coordinator deleted successfully' });
  } catch (err) {
    console.error('Error deleting coordinator:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Match detail by ID
router.get('/api/matches/:id', async (req, res) => {
  try {
    const matchDetails = await adminController.getMatchDetailsById(req.params.id);
    return res.json({ success: true, data: matchDetails });
  } catch (err) {
    console.error('Error getting match details:', err);
    return res.status(404).json({ success: false, message: err.message || 'Match not found' });
  }
});

// Delete match
router.delete('/matches/:id', async (req, res) => {
  try {
    const MatchSchemaModel = require('../models/schemas/matchSchema');
    const match = await MatchSchemaModel.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    await MatchSchemaModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Match deleted successfully' });
  } catch (err) {
    console.error('Error deleting match:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DB Optimization observability — indexes + Redis benchmark
router.get('/observability/db-optimization', async (req, res) => {
  try {
    const UserSchemaModel = require('../models/schemas/userSchema');
    const TeamSchemaModel = require('../models/schemas/teamSchema');
    const EventSchemaModel = require('../models/schemas/eventSchema');
    const MatchSchemaModel = require('../models/schemas/matchSchema');
    const SubscriptionSchemaModel = require('../models/schemas/subscriptionSchema');

    const [userIndexes, teamIndexes, eventIndexes, matchIndexes, subIndexes] = await Promise.all([
      UserSchemaModel.collection.indexes(),
      TeamSchemaModel.collection.indexes(),
      EventSchemaModel.collection.indexes(),
      MatchSchemaModel.collection.indexes(),
      SubscriptionSchemaModel.collection.indexes()
    ]);

    let redisBench = { status: 'unavailable' };
    try {
      const { redis } = require('../config/redis');
      const testKey = 'admin:db-opt-bench';
      await redis.set(testKey, JSON.stringify({ bench: true }), { ex: 60 });
      const hitStart = Date.now(); await redis.get(testKey); const redisHitMs = Date.now() - hitStart;
      const missStart = Date.now(); await redis.get('miss-' + Date.now()); const redisMissMs = Date.now() - missStart;
      redisBench = { status: 'active', hitLatencyMs: redisHitMs, missLatencyMs: redisMissMs, deltaMs: redisMissMs - redisHitMs };
    } catch (e) { /* Redis optional */ }

    return res.json({
      success: true,
      data: {
        indexes: {
          users: userIndexes.map(i => ({ name: i.name, fields: i.key })),
          teams: teamIndexes.map(i => ({ name: i.name, fields: i.key })),
          events: eventIndexes.map(i => ({ name: i.name, fields: i.key })),
          matches: matchIndexes.map(i => ({ name: i.name, fields: i.key })),
          subscriptions: subIndexes.map(i => ({ name: i.name, fields: i.key }))
        },
        redis: redisBench
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch DB optimization info', error: err.message });
  }
});

// API stats for Swagger
router.get('/observability/api-stats', async (req, res) => {
  try {
    const swaggerSpec = require('../config/swagger');
    const paths = swaggerSpec.paths || {};
    const pathKeys = Object.keys(paths);
    const tagCounts = {};
    pathKeys.forEach(p => { Object.values(paths[p]).forEach(op => { (op.tags || []).forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }); }); });
    const b2bEndpoints = Object.entries(tagCounts).filter(([t]) => t.startsWith('B2B')).map(([t, c]) => ({ tag: t, count: c }));
    const b2cEndpoints = Object.entries(tagCounts).filter(([t]) => t.startsWith('B2C')).map(([t, c]) => ({ tag: t, count: c }));
    return res.json({ success: true, data: { totalEndpoints: pathKeys.length, tagBreakdown: tagCounts, b2bEndpoints, b2cEndpoints, swaggerUrl: '/api-docs', openApiVersion: swaggerSpec.openapi || '3.0.0' } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch API stats', error: err.message });
  }
});

// Test results
router.get('/observability/test-results', async (req, res) => {
  try {
    const { execSync } = require('child_process');
    const pathMod = require('path');
    const backendDir = pathMod.join(__dirname, '..');
    let results = { status: 'unknown', passed: 0, failed: 0, total: 0, testFiles: [], lastRun: new Date().toISOString() };
    try {
      const raw = execSync('npx jest --json --passWithNoTests 2>&1', { cwd: backendDir, timeout: 60000, encoding: 'utf8' });
      const jsonStart = raw.indexOf('{');
      if (jsonStart !== -1) {
        const json = JSON.parse(raw.slice(jsonStart));
        results = {
          status: json.success ? 'passed' : 'failed',
          passed: json.numPassedTests || 0, failed: json.numFailedTests || 0, total: json.numTotalTests || 0,
          testFiles: (json.testResults || []).map(t => ({ file: pathMod.basename(t.testFilePath), passed: t.numPassingTests, failed: t.numFailingTests, status: t.status })),
          lastRun: new Date().toISOString()
        };
      }
    } catch (e) { results.status = 'error'; results.error = String(e.message || '').slice(0, 500); }
    return res.json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to run tests', error: err.message });
  }
});

// Deployment info
router.get('/observability/deployment', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        environment: process.env.NODE_ENV || 'development',
        frontend: { url: process.env.FRONTEND_URL || 'https://sports-amigo.vercel.app', platform: 'Vercel' },
        backend: { url: process.env.BACKEND_URL || 'https://sportsamigo.onrender.com', platform: 'Render' },
        commitId: process.env.COMMIT_SHA || process.env.RENDER_GIT_COMMIT || 'N/A',
        branch: process.env.RENDER_GIT_BRANCH || 'main',
        lastChecked: new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch deployment info', error: err.message });
  }
});

`;

const finalContent = content.slice(0, exportIdx) + newRoutes + 'module.exports = router;\n';
fs.writeFileSync(adminFile, finalContent, 'utf8');
console.log('SUCCESS: New routes appended. File length:', finalContent.length);
