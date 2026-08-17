import { APP_ID } from '@yuta/shared';
import type { DirEntry, FileSystemAdapter } from '@yuta/memory';

const PREFIX = `${APP_ID}-fs:`;
const DIRS = `${APP_ID}-dirs`;

function readIndex(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DIRS) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function writeIndex(dirs: Set<string>): void {
  localStorage.setItem(DIRS, JSON.stringify([...dirs]));
}

export class BrowserFileSystem implements FileSystemAdapter {
  async mkdir(path: string): Promise<void> {
    const dirs = readIndex();
    dirs.add(normalize(path));
    writeIndex(dirs);
  }

  async exists(path: string): Promise<boolean> {
    const key = normalize(path);
    return localStorage.getItem(PREFIX + key) != null || readIndex().has(key);
  }

  async readText(path: string): Promise<string> {
    return localStorage.getItem(PREFIX + normalize(path)) ?? '';
  }

  async writeText(path: string, contents: string): Promise<void> {
    const key = normalize(path);
    localStorage.setItem(PREFIX + key, contents);
    const parent = key.split('/').slice(0, -1).join('/');
    if (parent) await this.mkdir(parent);
  }

  async readDir(path: string): Promise<DirEntry[]> {
    const dir = normalize(path);
    const prefix = `${dir}/`;
    const entries = new Map<string, DirEntry>();
    for (const stored of readIndex()) {
      if (stored.startsWith(prefix)) {
        const name = stored.slice(prefix.length).split('/')[0];
        if (name) entries.set(name, { name, path: `${dir}/${name}`, isDirectory: true });
      }
    }
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const stored = key.slice(PREFIX.length);
      if (!stored.startsWith(prefix)) continue;
      const rest = stored.slice(prefix.length);
      const name = rest.split('/')[0];
      if (!name || rest.includes('/')) continue;
      entries.set(name, { name, path: stored, isDirectory: false });
    }
    return [...entries.values()];
  }

  async remove(path: string): Promise<void> {
    localStorage.removeItem(PREFIX + normalize(path));
  }
}

function normalize(path: string): string {
  return path.replaceAll('\\', '/').replace(/\/+$/, '');
}
