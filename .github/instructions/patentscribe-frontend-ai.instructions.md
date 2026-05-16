---
description: "Use when modifying PatentScribe React components, TypeScript frontend, AI prompts/providers, structured disclosure output, export flows, or storage integration. Covers yarn-first workflow, aiService ownership, typed patent models, and language adaptation based on the source document."
name: "PatentScribe Frontend And AI Conventions"
applyTo:
  - "src/**"
  - "package.json"
  - "README.md"
  - "GEMINI.md"
---

# PatentScribe Frontend And AI Conventions

- Use yarn for install, dev, build, typecheck, and related documentation updates. When scripts or docs mention npm, convert them to yarn unless the task explicitly requires otherwise.
- Keep React components in src/components focused on presentation and interaction. Put AI prompts, provider selection, schemas, and structured output parsing in src/lib/aiService.ts.
- Put persistence changes in src/lib/storage.ts and export-related changes in src/lib/exportUtils.ts instead of moving that logic into React components.
- Reuse and extend the shared patent domain types in src/types/patent.ts before introducing new ad-hoc object shapes in components or services.
- Follow the existing React + TypeScript function-component style with local state and effects. Do not introduce a global state library unless the task explicitly requires it.
- Preserve web and desktop compatibility. Frontend code that touches Tauri APIs should keep graceful fallback or error handling for browser-only Vite preview mode.
- When changing AI-generated disclosure or diagnosis fields, update the schema, service parsing, and UI renderers together so the structured output contract stays consistent.
- Patent-facing generated content, prompt wording, and follow-up questions should adapt to the language of the user input document or conversation. Do not hardcode Chinese-only output unless the task explicitly asks for it.
- Keep changes scoped to the requested slice. Avoid incidental rewrites of prompt tone, visual design, or storage shape when solving an unrelated task.