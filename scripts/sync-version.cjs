const fs = require('fs');
const path = require('path');

/**
 * 自动同步版本号脚本
 * 将 package.json 中的版本号同步到:
 * 1. src-tauri/Cargo.toml
 * 2. README.md
 */

const projectRoot = path.resolve(__dirname, '..');
const pkgPath = path.join(projectRoot, 'package.json');
const cargoPath = path.join(projectRoot, 'src-tauri', 'Cargo.toml');
const readmePath = path.join(projectRoot, 'README.md');

function sync() {
  if (!fs.existsSync(pkgPath)) {
    console.error('未找到 package.json');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const version = pkg.version;
  console.log(`🚀 正在同步版本号: ${version}`);

  // 1. 同步到 Cargo.toml
  if (fs.existsSync(cargoPath)) {
    let cargo = fs.readFileSync(cargoPath, 'utf8');
    const newCargo = cargo.replace(/^version = ".*"$/m, `version = "${version}"`);
    if (cargo !== newCargo) {
      fs.writeFileSync(cargoPath, newCargo);
      console.log('✅ 已更新 src-tauri/Cargo.toml');
    } else {
      console.log('ℹ️ src-tauri/Cargo.toml 版本号已是最新');
    }
  }

  // 2. 同步到 README.md
  if (fs.existsSync(readmePath)) {
    let readme = fs.readFileSync(readmePath, 'utf8');
    const newReadme = readme.replace(/^当前版本：.*$/m, `当前版本：${version}`);
    if (readme !== newReadme) {
      fs.writeFileSync(readmePath, newReadme);
      console.log('✅ 已更新 README.md');
    } else {
      console.log('ℹ️ README.md 版本号已是最新');
    }
  }

  console.log('✨ 版本同步完成！');
}

sync();
