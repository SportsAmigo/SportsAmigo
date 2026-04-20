const fs = require('fs');
const file = 'frontend/src/components/layout/AdminLayout.jsx';
let content = fs.readFileSync(file, 'utf8');

const tiersLink = `                        <Link
                            to="/admin/tiers"
                            className={\`sidebar-nav-item \${isActive('/admin/tiers') ? 'active' : ''}\`}
                        >
                            <i className="fa fa-layer-group"></i>
                            Organizer Tiers
                        </Link>
                        `;

// Insert the Tiers link before the Verification Hub link
const verificationLinkPattern = /(\s*<Link\s*\r?\n\s*to="\/admin\/verification")/;
if (verificationLinkPattern.test(content)) {
    content = content.replace(verificationLinkPattern, '\n                        ' + tiersLink.trim() + '\n$1');
    fs.writeFileSync(file, content, 'utf8');
    console.log('SUCCESS: Tiers link added');
} else {
    console.log('WARN: Verification link pattern not found');
    console.log('Snippet around verification:', content.substring(content.indexOf('admin/verification') - 100, content.indexOf('admin/verification') + 50));
}
