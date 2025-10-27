const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

exports.default = async function(context) {
  const { appOutDir, packager } = context;
  const platform = packager.platform.name;

  console.log('AfterPack: Copying electron-backend node_modules...');
  console.log('Platform:', platform);
  console.log('App out dir:', appOutDir);

  // Source: electron-backend/node_modules
  const sourceNodeModules = path.join(__dirname, '..', 'electron-backend', 'node_modules');

  // Destination: resources/app.asar.unpacked/electron-backend/node_modules
  const destNodeModules = path.join(
    appOutDir,
    'resources',
    'app.asar.unpacked',
    'electron-backend',
    'node_modules'
  );

  console.log('Source:', sourceNodeModules);
  console.log('Destination:', destNodeModules);

  if (!fs.existsSync(sourceNodeModules)) {
    console.error('ERROR: Source node_modules not found!');
    console.error('Please run: cd electron-backend && npm install');
    throw new Error('electron-backend/node_modules not found');
  }

  // Ensure destination parent directory exists
  const destParent = path.dirname(destNodeModules);
  if (!fs.existsSync(destParent)) {
    fs.mkdirSync(destParent, { recursive: true });
  }

  // Copy node_modules
  console.log('Copying node_modules...');
  try {
    // Use native recursive copy
    copyDirSync(sourceNodeModules, destNodeModules);
    console.log('AfterPack: node_modules copied successfully!');
  } catch (error) {
    console.error('Error copying node_modules:', error);
    throw error;
  }
};
