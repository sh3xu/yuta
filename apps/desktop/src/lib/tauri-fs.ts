import { BaseDirectory, exists, mkdir, readDir, readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs';
import type { DirEntry, FileSystemAdapter } from '@yuta/memory';

const base = { baseDir: BaseDirectory.AppData };

export class TauriFileSystem implements FileSystemAdapter {
  async mkdir(path: string): Promise<void> {
    await mkdir(normalize(path), { ...base, recursive: true });
  }

  async exists(path: string): Promise<boolean> {
    return exists(normalize(path), base);
  }

  async readText(path: string): Promise<string> {
    return readTextFile(normalize(path), base);
  }

  async writeText(path: string, contents: string): Promise<void> {
    const parent = normalize(path).split('/').slice(0, -1).join('/');
    if (parent) await this.mkdir(parent);
    await writeTextFile(normalize(path), contents, base);
  }

  async readDir(path: string): Promise<DirEntry[]> {
    const dir = normalize(path);
    const listing = await readDir(dir, base);
    return listing.map((entry) => ({
      name: entry.name,
      path: `${dir}/${entry.name}`,
      isDirectory: Boolean(entry.isDirectory),
    }));
  }

  async remove(path: string): Promise<void> {
    await remove(normalize(path), base);
  }
}

function normalize(path: string): string {
  return path.replaceAll('\\', '/');
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
