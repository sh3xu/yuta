import type { RetrievedMemory } from '@yuta/shared';
import { MEMORY_CATEGORIES, MEMORY_HIT_LIMIT, type MemoryCategory } from '@yuta/shared';
import { type MemoryRecord, type NewMemory, parseMemory, serializeMemory, slugify } from './format';
import { routeCategory, tokenize } from './retrieval/router';
import { scoreMemory, toRetrieved } from './retrieval/score';
import type { FileSystemAdapter } from './storage/adapter';

const LOOKUP_FILE_LIMIT = 24;

export class MemoryService {
  constructor(
    private readonly fs: FileSystemAdapter,
    private readonly root: string,
  ) {}

  async init(): Promise<void> {
    await this.fs.mkdir(this.root);
    for (const category of MEMORY_CATEGORIES) {
      await this.fs.mkdir(this.join(category));
    }
  }

  async retrieve(query: string, category?: MemoryCategory): Promise<RetrievedMemory[]> {
    const needle = query.trim();
    if (!needle) return [];

    await this.init();
    const cat = category ?? routeCategory(needle);
    const dir = this.join(cat);
    if (!(await this.fs.exists(dir))) return [];

    const entries = (await this.fs.readDir(dir)).filter(
      (entry) => !entry.isDirectory && entry.name.endsWith('.md'),
    );
    const tokens = tokenize(needle);
    const matching = tokens.length
      ? entries.filter((entry) => tokens.some((token) => entry.name.toLowerCase().includes(token)))
      : [];
    const pool = (matching.length > 0 ? matching : entries).slice(-LOOKUP_FILE_LIMIT);
    const ranked: Array<{ record: MemoryRecord; score: number }> = [];

    for (const entry of pool) {
      const record = parseMemory(entry.path, await this.fs.readText(entry.path));
      const score = scoreMemory(needle, record);
      if (score > 0.08) ranked.push({ record, score });
    }

    return ranked
      .sort((a, b) => b.score - a.score)
      .slice(0, MEMORY_HIT_LIMIT)
      .map((item) => toRetrieved(item.record, item.score));
  }

  async write(input: NewMemory): Promise<MemoryRecord> {
    await this.init();
    const now = new Date().toISOString().slice(0, 10);
    const title = input.title ?? input.content.split('\n')[0]?.slice(0, 80) ?? 'memory';
    const id = `${slugify(title)}-${now}`;
    const record: MemoryRecord = {
      id,
      category: input.category,
      path: this.join(input.category, `${id}.md`),
      title,
      content: input.content,
      tags: input.tags ?? [],
      importance: input.importance ?? 0.6,
      created: now,
      updated: now,
    };
    await this.fs.writeText(record.path, serializeMemory(record));
    return record;
  }

  async list(category?: MemoryCategory): Promise<MemoryRecord[]> {
    await this.init();
    const categories = category ? [category] : [...MEMORY_CATEGORIES];
    const records: MemoryRecord[] = [];
    for (const item of categories) {
      const dir = this.join(item);
      if (!(await this.fs.exists(dir))) continue;
      for (const entry of await this.fs.readDir(dir)) {
        if (entry.isDirectory || !entry.name.endsWith('.md')) continue;
        const raw = await this.fs.readText(entry.path);
        records.push(parseMemory(entry.path, raw));
      }
    }
    return records;
  }

  async delete(path: string): Promise<void> {
    await this.fs.remove(path);
  }

  async clear(): Promise<void> {
    for (const category of MEMORY_CATEGORIES) {
      const dir = this.join(category);
      if (!(await this.fs.exists(dir))) continue;
      for (const entry of await this.fs.readDir(dir)) {
        if (!entry.isDirectory) await this.fs.remove(entry.path);
      }
    }
  }

  private join(...parts: string[]): string {
    return [this.root, ...parts].join('/').replaceAll('\\', '/');
  }
}
