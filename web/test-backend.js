/**
 * Test script to verify backend setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Auto-Architect Web Backend Setup\n');

// Check 1: Node modules
console.log('1. Checking node_modules...');
if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('   ✅ node_modules found');
} else {
  console.log('   ❌ node_modules not found. Run: npm install');
  process.exit(1);
}

// Check 2: CLI build
console.log('\n2. Checking Auto-Architect CLI build...');
const cliPath = path.join(__dirname, '..', 'dist', 'cli', 'index.js');
if (fs.existsSync(cliPath)) {
  console.log('   ✅ CLI found at:', cliPath);
} else {
  console.log('   ❌ CLI not found. Run: npm run build (in root directory)');
  process.exit(1);
}

// Check 3: Server file
console.log('\n3. Checking server.js...');
if (fs.existsSync(path.join(__dirname, 'server.js'))) {
  console.log('   ✅ server.js found');
} else {
  console.log('   ❌ server.js not found');
  process.exit(1);
}

// Check 4: Required dependencies
console.log('\n4. Checking dependencies...');
const packageJson = require('./package.json');
const requiredDeps = ['express', 'multer', 'cors'];

let allDepsOk = true;
requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`   ✅ ${dep}`);
  } else {
    console.log(`   ❌ ${dep} missing`);
    allDepsOk = false;
  }
});

if (!allDepsOk) {
  console.log('\n   Run: npm install');
  process.exit(1);
}

console.log('\n✅ All checks passed! You can now run: npm start');
console.log('\nThen open: http://localhost:3000\n');
