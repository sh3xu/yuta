import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.TAURI_DEV_HOST;
const MOTION_PACK_ID = 'virtual:motion-pack';
const MOTION_PACK_RESOLVED = `\0${MOTION_PACK_ID}`;

function motionPackPlugin(packDir: string): Plugin {
  const source = () => {
    const files = fs.existsSync(packDir)
      ? fs
          .readdirSync(packDir)
          .filter((name) => name.endsWith('.motion3.json'))
          .sort()
          .map((name) => `motions_pack/${name}`)
      : [];
    return `export const MOTION_PACK_FILES = ${JSON.stringify(files)};`;
  };
  return {
    name: 'yuta-motion-pack',
    resolveId(id) {
      if (id === MOTION_PACK_ID) return MOTION_PACK_RESOLVED;
    },
    load(id) {
      if (id === MOTION_PACK_RESOLVED) return source();
    },
    configureServer(server) {
      server.watcher.add(packDir);
      const reload = (file: string) => {
        if (!file.startsWith(packDir) || !file.endsWith('.motion3.json')) return;
        const module = server.moduleGraph.getModuleById(MOTION_PACK_RESOLVED);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
    },
  };
}

export default defineConfig({
  plugins: [
    motionPackPlugin(path.resolve(root, 'public/characters/hiyori/motions_pack')),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: {
      ignored: ['**/src-tauri/**', '**/*.rar', '**/*.zip'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
});
