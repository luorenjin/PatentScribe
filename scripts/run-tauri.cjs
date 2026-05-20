const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const tauriConfigPath = path.join(repoRoot, 'src-tauri', 'tauri.conf.json');
const packageJsonPath = path.join(repoRoot, 'package.json');

function runOrExit(command, args, options = {}) {
  const needsShell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(command);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: needsShell,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.signal) {
    process.exit(1);
  }
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getTauriBinaryPath() {
  const binName = process.platform === 'win32' ? 'tauri.cmd' : 'tauri';
  return path.join(repoRoot, 'node_modules', '.bin', binName);
}

function patchBuiltMsis() {
  if (process.platform !== 'win32') {
    return;
  }

  const packageJson = loadJson(packageJsonPath);
  const tauriConfig = loadJson(tauriConfigPath);
  const productName = tauriConfig.productName || packageJson.name;
  const version = packageJson.version;
  const publisher = tauriConfig.bundle?.publisher || packageJson.publisher || productName;
  const title = tauriConfig.bundle?.shortDescription || packageJson.description || productName;
  const subject = tauriConfig.bundle?.shortDescription || packageJson.description || title;
  const keywords = `Installer;${productName};${publisher}`;
  const comments = `${productName} desktop installer package published by ${publisher}.`;
  const msiDir = path.join(repoRoot, 'src-tauri', 'target', 'release', 'bundle', 'msi');

  if (!fs.existsSync(msiDir)) {
    return;
  }

  const expectedPrefix = `${productName}_${version}`;
  const msiFiles = fs
    .readdirSync(msiDir)
    .filter((fileName) => fileName.toLowerCase().endsWith('.msi') && fileName.startsWith(expectedPrefix))
    .map((fileName) => path.join(msiDir, fileName));

  if (msiFiles.length === 0) {
    return;
  }

  for (const msiPath of msiFiles) {
    runOrExit('powershell.exe', [
      '-NoLogo',
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      path.join(repoRoot, 'scripts', 'fix-msi-summary.ps1'),
      '-MsiPath',
      msiPath,
      '-Title',
      title,
      '-Subject',
      subject,
      '-Author',
      publisher,
      '-Keywords',
      keywords,
      '-Comments',
      comments,
    ]);
  }
}

runOrExit(process.execPath, [path.join(repoRoot, 'scripts', 'sync-version.cjs')]);

const tauriArgs = process.argv.slice(2);
runOrExit(getTauriBinaryPath(), tauriArgs);

if (tauriArgs.includes('build')) {
  patchBuiltMsis();
}