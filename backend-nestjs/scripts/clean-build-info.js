const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const entries = fs.readdirSync(cwd);

const targets = entries.filter(entry => /^tsconfig.*\.tsbuildinfo$/.test(entry));

for (const target of targets) {
  const filePath = path.join(cwd, target);
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}
