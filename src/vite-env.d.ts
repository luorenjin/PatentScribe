/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_REQUIRE_ACTIVATION: string;
  readonly VITE_ENABLE_EMAIL_VERIFICATION: string;
  readonly VITE_ENABLE_LICENSE_FILE: string;
  readonly VITE_ALLOWED_EMAIL_DOMAINS: string;
  readonly VITE_ACTIVATION_API_BASE_URL: string;
  readonly VITE_ACTIVATION_SUPPORT_EMAIL: string;
  readonly VITE_QWEN_API_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
