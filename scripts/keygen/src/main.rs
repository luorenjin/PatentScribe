use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rsa::pkcs8::DecodePrivateKey;
use rsa::{Pkcs1v15Sign, RsaPrivateKey};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::env;
use std::io::{self, Write};

const PRIVATE_KEY_PEM: &str = r#"-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----"#;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LicenseData {
    machine_code: String,
    expiry_date: String,
}

#[derive(Serialize)]
struct LicenseWrapper {
    data: String,
    signature: String,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("========================================");
    println!("   PatentMate License 生成工具 (Rust)   ");
    println!("========================================\n");

    let args: Vec<String> = env::args().collect();
    let mut machine_code = args.get(1).cloned().unwrap_or_default();
    let mut expiry_date = args.get(2).cloned().unwrap_or_default();

    if machine_code.is_empty() {
        print!("请输入用户的机器码: ");
        io::stdout().flush()?;
        let mut input = String::new();
        io::stdin().read_line(&mut input)?;
        machine_code = input.trim().to_string();
    }

    if machine_code.is_empty() {
        eprintln!("\n错误: 必须提供机器码。");
        return Ok(());
    }

    if expiry_date.is_empty() {
        print!("请输入有效期 (YYYY-MM-DD) [默认: 2026-12-31]: ");
        io::stdout().flush()?;
        let mut input = String::new();
        io::stdin().read_line(&mut input)?;
        expiry_date = input.trim().to_string();
        if expiry_date.is_empty() {
            expiry_date = "2026-12-31".to_string();
        }
    }

    // 1. 构建 JSON 数据字符串
    let data = LicenseData {
        machine_code: machine_code.clone(),
        expiry_date: expiry_date.clone(),
    };
    let data_json = serde_json::to_string(&data)?;

    // 2. 签名
    let priv_key = RsaPrivateKey::from_pkcs8_pem(PRIVATE_KEY_PEM)?;
    
    // Node.js crypto.createSign('SHA256') 对应 PKCS#1 v1.5
    let mut hasher = Sha256::new();
    hasher.update(data_json.as_bytes());
    let hashed = hasher.finalize();
    
    let signature = priv_key.sign(Pkcs1v15Sign::new::<Sha256>(), &hashed)?;
    let signature_base64 = BASE64.encode(signature);

    // 3. 构建外层 Wrapper 并 Base64 编码
    let wrapper = LicenseWrapper {
        data: data_json,
        signature: signature_base64,
    };
    let wrapper_json = serde_json::to_string(&wrapper)?;
    let final_license = BASE64.encode(wrapper_json);

    println!("\n----------------------------------------");
    println!("机器码: [{}]", machine_code);
    println!("有效期: [{}]", expiry_date);
    println!("----------------------------------------");
    println!("\nLicense 内容 (请完整复制):");
    println!("\n{}\n", final_license);
    println!("----------------------------------------");

    println!("\n按回车键退出...");
    let mut _unused = String::new();
    io::stdin().read_line(&mut _unused)?;

    Ok(())
}
