const fs = require('fs');
const path = require('path');

const entryPath = path.resolve(__dirname, '..', 'dist', 'main.js');

if (!fs.existsSync(entryPath)) {
  console.error('\n[build] Expected backend entry not found:', entryPath);
  console.error('[build] Ensure tsconfig.build.json outputs to dist/ and main.ts compiles.');
  process.exit(1);
}

console.log('[build] Verified backend entry:', entryPath);
