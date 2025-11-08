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

// Update hacs-frontend/package.json
const hacsFrontendPackagePath = path.join(__dirname, '../../hacs-frontend/package.json');
const hacsFrontendPackage = JSON.parse(fs.readFileSync(hacsFrontendPackagePath, 'utf8'));
hacsFrontendPackage.version = version;
fs.writeFileSync(hacsFrontendPackagePath, JSON.stringify(hacsFrontendPackage, null, 2) + '\n');
console.log('✓ Updated hacs-frontend/package.json');

// Update hacs-frontend/custom_components/homeguardian_ui/manifest.json
const hacsManifestPath = path.join(__dirname, '../../hacs-frontend/custom_components/homeguardian_ui/manifest.json');
const hacsManifest = JSON.parse(fs.readFileSync(hacsManifestPath, 'utf8'));
hacsManifest.version = version;
fs.writeFileSync(hacsManifestPath, JSON.stringify(hacsManifest, null, 2) + '\n');
console.log('✓ Updated hacs-frontend manifest.json');

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

// Build hacs-frontend to generate dist files
console.log('Building hacs-frontend...');
try {
  execSync('cd hacs-frontend && npm install && npm run build', { stdio: 'inherit' });
  console.log('✓ Built hacs-frontend dist files');
} catch (error) {
  console.error('✗ Error: Failed to build hacs-frontend');
  process.exit(1);
}

// Update custom_components/homeguardian_ui/manifest.json (root for HACS)
const rootManifestPath = path.join(__dirname, '../../custom_components/homeguardian_ui/manifest.json');
const rootManifest = JSON.parse(fs.readFileSync(rootManifestPath, 'utf8'));
rootManifest.version = version;
fs.writeFileSync(rootManifestPath, JSON.stringify(rootManifest, null, 2) + '\n');
console.log('✓ Updated custom_components manifest.json');

// Copy dist files to custom_components (root for HACS)
console.log('Copying dist files to custom_components...');
try {
  execSync('cp -r hacs-frontend/custom_components/homeguardian_ui/www/dist/* custom_components/homeguardian_ui/www/dist/', { stdio: 'inherit' });
  console.log('✓ Copied dist files to custom_components');
} catch (error) {
  console.error('✗ Error: Failed to copy dist files');
  process.exit(1);
}

console.log(`\n✅ Successfully updated all files to version ${version}`);
