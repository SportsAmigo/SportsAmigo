const fs = require('fs');
const file = 'frontend/src/App.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import after AdminCoordinators import
const coordinatorsImport = "import AdminCoordinators from './pages/admin/AdminCoordinators';";
const tiersImport = "import AdminTiers from './pages/admin/AdminTiers';";
if (!content.includes(tiersImport)) {
    content = content.replace(coordinatorsImport, coordinatorsImport + '\n' + tiersImport);
    console.log('Added AdminTiers import');
} else {
    console.log('AdminTiers import already exists');
}

// 2. Add route after /admin/commissions route closing
const commissionsRoute = `        <Route
          path="/admin/commissions"`;
const tiersRoute = `
        <Route
          path="/admin/tiers"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminTiers />
            </ProtectedRoute>
          }
        />`;
if (!content.includes('/admin/tiers')) {
    // Find the end of commissions route block and insert before it
    const verificationIdx = content.indexOf('path="/admin/verification"');
    if (verificationIdx !== -1) {
        // Find the Route opening before verification
        const routeBeforeVerif = content.lastIndexOf('<Route', verificationIdx);
        content = content.slice(0, routeBeforeVerif) + tiersRoute + '\n        ' + content.slice(routeBeforeVerif);
        console.log('Added /admin/tiers route');
    } else {
        console.log('Could not find insertion point for tiers route');
    }
} else {
    console.log('/admin/tiers route already exists');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done');
