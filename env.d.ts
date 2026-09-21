/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "false" switches the app from the in-memory mock to the real backend. */
  readonly VITE_USE_MOCK_API?: string
  /** Base URL of ../shotgun-api, used only when the mock is off. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
