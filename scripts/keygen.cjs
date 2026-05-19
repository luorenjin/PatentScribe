const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * 既然 pkg 的静态资源打包在某些环境下不稳定，
 * 我们直接将私钥内嵌在代码中，确保生成的 exe 100% 可用且不依赖外部文件。
 */
const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCf/SX0oRq4KlD2
+TWdTSvmOtO1THJES9Nt2rSuzm9BENWwEo3DAI/UuWZCelid4EG8gIvH9CokrkK+
9t/NvhvRhQOK3QIe9Bz02yltJj8Unx1NEQWKhvx6ScPsiimAJdFe7kVmRReLnxGF
pV4Tt2Wqdyl4oBVxJxSVAxENq/Fk4Ey3L6a8ry6TZFOImJ90mSoKSHzi7xzhdgjs
X7L36OhsgAKYDdwVNztqZ65zAvf9IbWeAmZoBWru3mMC2lbyvMaMFyJdCtiX52vz
9038sxdBa1eEz/BUlCTYMtKDWm5d9P90wzzl+ptfqMhM5P2AFtiNnNXPA0vwyhNk
BuYJi9JhAgMBAAECggEAFCff3sRnKdmG7r5xvzoINE6n+ljBspH89oONrNIsGP3m
dfK4cl9BP5MF640fWfB1R6rIMW402v8rQIS4qGJxfcFss1Npn32wojZ0LyCY5N+w
4NMqqAuehkeBy+ySEudwy61oB9zffQMSwYwWYJSD1eiCTISafvFl+enzfY3ycPtQ
B8Q9EUKOpVUi4YnYmpMKfCtIduKq8RVRQfDInMjKCtmdlLrkzf5TqWQl5VhspAhV
4sqFPyln7HFIcIARbVP7S9hqHsc2jBznLex10Y5F7/63+zvlwm7+bi3/+JZA049/
IkoXlBdDvNR9cyBFAkWZQ1CixI8Y2BCqfL4CN+BtAwKBgQDXR0YjxbI2zyDeJUYt
LVMFLaUfqfUrjnB+5+DyB9txN49f3+V+P+IJYqDbtjKIx+abwrPZ6gzYuAVza5n8
Ng0455xag/OpF8qnwsRYUf05EveHPlV6raZftmqZEVEipSzirpLrNB3iDsGSRFUG
wKGSIkewR0dnc78D4vBh0k9V9wKBgQC+QILnHSMTtNRPtd4/Wo4fTihn/evq+c9I
pjCCOelhU+zqxCxZhuo0cSvosJ50D8rA9XqLgn48HZorDSKvH21CRcf4iWkfvUXi
+IwIMT336HOoxnlvxCTbL/A/kQEU+KDWYcjjOw10duzAoEhl6wyNOU7Jr004Vrwy
DDIo0GKkZwKBgQDNUZvyuDXNkmTtmi1BHy5EDRGkjmtXXGWsk6j2DUpcw7nJnff6
HiGOA/QZOL8ft1AZFGyGFHSmKXSBbYmSg1a/BB8aMSkuB5PvxpGPDrttOMq9wVSz
SXUZahhm3p48Zb7Wf9t92dn6ZUp3Hxbc9tHiVzF6TbErWLhAk6viEDw8ZwKBgDIs
yVkycgHMewHasRZ8R2cyMa3bZdC+uVArpDd0Fny4qY7w1dF2p2XVQwNHMULit1JU
a1FHxQsNs48PE8qjuyjzRl3hv3vDax8E9cljUziCcZ5dWcGENUQpTG83StXBDIn9
mAF1nYLNqnrSysU2TEUijAjc1ry5A0EfvkrNSnaZAoGBAM9VvmF6BBJUZtFkEqoK
Uz78KzlSN2qt8FsSmhey8XcbQWVkSACZoJMsY0T87nWvdwVYorJJ2kjPuq2U9e6/
SfovO2ydJ2rFjEgYi2lsFCulCfPx/DKMlS3/KfSyjqGYsARJosI0Y9Nn535bJVwd
EhGfwV2Q3zbnEoVEKIC21zg6
-----END PRIVATE KEY-----`;

function signLicense(machineCode, expiryDate) {
  const data = JSON.stringify({ machineCode, expiryDate });
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  const signature = sign.sign(PRIVATE_KEY_PEM, 'base64');
  
  const licenseObj = {
    data: data,
    signature: signature
  };
  
  return Buffer.from(JSON.stringify(licenseObj)).toString('base64');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function run() {
  console.log("========================================");
  console.log("   PatentMate License 生成工具 (v1.4)   ");
  console.log("========================================\n");

  console.log("[系统信息] 密钥已内嵌，准备就绪。");

  // 获取命令行参数
  const args = process.argv.slice(2);
  let machineCode = args[0];
  let expiryDate = args[1];

  if (!machineCode) {
    machineCode = await question("请输入用户的机器码: ");
  }
  if (!expiryDate) {
    expiryDate = await question("请输入有效期 (YYYY-MM-DD): ");
    if (!expiryDate) expiryDate = "2026-12-31";
  }

  machineCode = machineCode ? machineCode.trim() : "";
  expiryDate = expiryDate ? expiryDate.trim() : "";

  if (!machineCode) {
    console.log("\n错误: 必须提供机器码。");
  } else {
    try {
      const license = signLicense(machineCode, expiryDate);
      console.log("\n----------------------------------------");
      console.log(`机器码: [${machineCode}]`);
      console.log(`有效期: [${expiryDate}]`);
      console.log("----------------------------------------");
      console.log("\nLicense 内容 (请完整复制):");
      console.log("\n" + license + "\n");
      console.log("----------------------------------------");
    } catch (err) {
      console.error("\n生成失败:", err.message);
    }
  }

  console.log("\n按回车键退出...");
  await question("");
  rl.close();
}

run();
