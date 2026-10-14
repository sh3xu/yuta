/// <reference types="vite/client" />

declare module 'virtual:motion-pack' {
  export const MOTION_PACK_FILES: string[];
}

interface Window {
  __TAURI_INTERNALS__?: unknown;
  Live2DCubismCore?: unknown;
}
