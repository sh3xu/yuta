import { MEMORY_CATEGORIES, type MemoryCategory } from '@yuta/shared';

export interface MemoryRecord {
  id: string;
  category: MemoryCategory;
  path: string;
  title: string;
  content: string;
  tags: string[];
  importance: number;
  created: string;
  updated: string;
}

export interface NewMemory {
  category: MemoryCategory;
  content: string;
  topic?: string;
  tags?: string[];
  importance?: number;
  title?: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function serializeMemory(record: MemoryRecord): string {
  return `${record.content.trim()}\n`;
}

export function parseMemory(path: string, raw: string): MemoryRecord {
  const match = raw.match(FRONTMATTER);
  const body = match ? match[2].trim() : raw.trim();
  const meta = match ? parseFrontmatter(match[1]) : {};
  const category = (
    typeof meta.type === 'string' ? meta.type : categoryFromPath(path)
  ) as MemoryCategory;
  const title = typeof meta.title === 'string' ? meta.title : titleFromContent(body);
  const tags = Array.isArray(meta.tags)
    ? meta.tags.filter(Boolean)
    : typeof meta.tags === 'string' && meta.tags
      ? [meta.tags]
      : [];

  return {
    id: typeof meta.id === 'string' ? meta.id : slugFromPath(path),
    category,
    path,
    title,
    content: body,
    tags,
    importance: Number(meta.importance ?? 0.5),
    created:
      typeof meta.created === 'string' ? meta.created : new Date().toISOString().slice(0, 10),
    updated:
      typeof meta.updated === 'string' ? meta.updated : new Date().toISOString().slice(0, 10),
  };
}

function parseFrontmatter(block: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  let listKey: string | null = null;
  const list: string[] = [];

  const flushList = () => {
    if (listKey) {
      result[listKey] = [...list];
      list.length = 0;
      listKey = null;
    }
  };

  for (const line of block.split('\n')) {
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && listKey) {
      list.push(listItem[1].replace(/^\[\]$/, '').trim());
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    flushList();
    const [, key, value] = kv;
    if (value === '' || value === '[]') {
      listKey = key;
      continue;
    }
    result[key] = unquote(value);
  }
  flushList();
  return result;
}

function categoryFromPath(path: string): MemoryCategory {
  const parts = path.replaceAll('\\', '/').split('/');
  const hit = parts.find((part) => (MEMORY_CATEGORIES as readonly string[]).includes(part));
  return (hit as MemoryCategory | undefined) ?? 'knowledge';
}

function slugFromPath(path: string): string {
  return path.replaceAll('\\', '/').split('/').at(-1)?.replace(/\.md$/, '') ?? crypto.randomUUID();
}

function titleFromContent(content: string): string {
  const line = content.split('\n').find((item) => item.trim().length > 0);
  return line?.slice(0, 80) ?? 'memory';
}

function unquote(value: string): string {
  return value.replace(/^["']|["']$/g, '');
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'memory'
  );
}
