const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEY_DIR = path.join(__dirname, 'keys');
const PRIVATE_KEY_PATH = path.join(KEY_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEY_DIR, 'public.pem');

// Ensure keys directory exists
if (!fs.existsSync(KEY_DIR)) {
  fs.mkdirSync(KEY_DIR);
}

function getOrGenerateKeys() {
  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    console.log("--- 使用现有的密钥对 ---");
    return {
      privateKey: fs.readFileSync(PRIVATE_KEY_PATH, 'utf8'),
      publicKey: fs.readFileSync(PUBLIC_KEY_PATH, 'utf8')
    };
  }

  console.log("--- 正在生成新的 RSA 密钥对... ---");
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
  
  console.log(`密钥已保存至: ${KEY_DIR}`);
  return { publicKey, privateKey };
}

function signLicense(machineCode, expiryDate, privateKeyPem) {
  const data = JSON.stringify({ machineCode, expiryDate });
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  const signature = sign.sign(privateKeyPem, 'base64');
  
  const licenseObj = {
    data: data,
    signature: signature
  };
  
  return Buffer.from(JSON.stringify(licenseObj)).toString('base64');
}

const { publicKey, privateKey } = getOrGenerateKeys();

console.log("\n--- PUBLIC KEY (建议将其配置到根目录的 .env 文件中的 LICENSE_PUBLIC_KEY) ---");
console.log(publicKey.replace(/\n/g, "\\n"));

console.log("\n--- 生成测试 License ---");
const args = process.argv.slice(2);
const machineCode = args[0] || "TEST-MACHINE-CODE";
const expiryDate = args[1] || "2026-12-31";

const license = signLicense(machineCode, expiryDate, privateKey);
console.log(`机器码: ${machineCode}`);
console.log(`有效期: ${expiryDate}`);
console.log(`\nLicense 内容 (复制到软件激活窗口):\n${license}`);

console.log("\n提示: 如果您修改了密钥对，请务必同步更新 .env 中的 LICENSE_PUBLIC_KEY 并重新启动应用。");
