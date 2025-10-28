/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Agrega otras variables de entorno aquí si las usas
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

