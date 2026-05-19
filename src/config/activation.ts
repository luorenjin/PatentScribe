/**
 * 软件激活配置文件
 */
export const ACTIVATION_CONFIG = {
  // 是否强制要求激活才能使用上传解析功能
  REQUIRE_ACTIVATION: true,
  
  // 启用企业邮箱激活方式
  ENABLE_EMAIL_VERIFICATION: true,
  
  // 启用机器码授权文件激活方式
  ENABLE_LICENSE_FILE: true,
  
  // 离线激活联系人/支持邮箱
  SUPPORT_EMAIL: import.meta.env.VITE_ACTIVATION_SUPPORT_EMAIL || "support@patentmate.ai",
  
  // 企业邮箱后缀限制 (留空则不限制)
  ALLOWED_EMAIL_DOMAINS: ["company.com", "patent.org"],
  
  // API 基础路径 (用于在线验证码请求)
  API_BASE_URL: "https://api.patentmate.ai/v1/activation"
};

export interface ActivationStatus {
  isActivated: boolean;
  machineCode: string;
  expiryDate?: string;
  licenseData?: string;
}
