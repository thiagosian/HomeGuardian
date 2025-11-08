#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const version = process.argv[2];

if (!version) {
  console.error('Error: Version argument is required');
  process.exit(1);
}

console.log(`Updating version to ${version} across all files...`);

// Update config.yaml
const configPath = path.join(__dirname, '../../config.yaml');
let configContent = fs.readFileSync(configPath, 'utf8');
configContent = configContent.replace(
  /^version:\s*".*"$/m,
  `version: "${version}"`
);
fs.writeFileSync(configPath, configContent);
console.log('✓ Updated config.yaml');

// Update Dockerfile
const dockerfilePath = path.join(__dirname, '../../Dockerfile');
let dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
dockerfileContent = dockerfileContent.replace(
  /io\.hass\.version=".*"/,
  `io.hass.version="${version}"`
);
fs.writeFileSync(dockerfilePath, dockerfileContent);
console.log('✓ Updated Dockerfile');

// Update backend/package.json
const backendPackagePath = path.join(__dirname, '../../backend/package.json');
const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
backendPackage.version = version;
fs.writeFileSync(backendPackagePath, JSON.stringify(backendPackage, null, 2) + '\n');
console.log('✓ Updated backend/package.json');

// Update frontend/package.json
const frontendPackagePath = path.join(__dirname, '../../frontend/package.json');
const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
frontendPackage.version = version;
fs.writeFileSync(frontendPackagePath, JSON.stringify(frontendPackage, null, 2) + '\n');
console.log('✓ Updated frontend/package.json');

// Update package-lock.json files
console.log('Updating package-lock.json files...');
try {
  execSync('cd backend && npm install --package-lock-only', { stdio: 'inherit' });
  console.log('✓ Updated backend/package-lock.json');
} catch (error) {
  console.warn('⚠ Warning: Failed to update backend/package-lock.json');
}

try {
  execSync('cd frontend && npm install --package-lock-only', { stdio: 'inherit' });
  console.log('✓ Updated frontend/package-lock.json');
} catch (error) {
  console.warn('⚠ Warning: Failed to update frontend/package-lock.json');
}

console.log(`\n✅ Successfully updated all files to version ${version}`);
