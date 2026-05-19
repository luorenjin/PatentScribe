---
description: "Use when modifying PatentMate Tauri Rust backend, desktop capabilities, native plugins, filesystem integration, or browser-versus-desktop compatibility. Covers minimal plugin registration, explicit native boundaries, and safe desktop integration."
name: "PatentMate Tauri Conventions"
...
# PatentMate Tauri Conventions
  - "src/lib/storage.ts"
  - "src/lib/exportUtils.ts"
  - "src/App.tsx"
---

# PatentMate Tauri Conventions

- Keep Tauri-specific behavior behind clear boundaries so the Vite web preview can still run without native support.
- Keep plugin registration in src-tauri/src/main.rs minimal and explicit. Prefer existing plugins and abstractions before adding custom native commands.
- When adding desktop-only capabilities, update the corresponding Tauri configuration and frontend error handling together.
- Prefer focused native changes over broad Rust refactors. Extend the current plugin-based setup before introducing new backend architecture.
- Preserve existing data flow between the frontend workbench, storage helpers, and Tauri-backed persistence rather than duplicating persistence logic in multiple layers.