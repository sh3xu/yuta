import type { RetrievedMemory } from '@yuta/shared';
import type { MemoryRecord } from '../format';
import { tokenize } from './router';

export function scoreMemory(query: string, record: MemoryRecord): number {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return record.importance * 0.2;

  const haystack = tokenize(
    `${record.title} ${record.content} ${record.tags.join(' ')} ${record.path}`,
  );
  let overlap = 0;
  for (const token of haystack) {
    if (queryTokens.has(token)) overlap += 1;
  }

  const tagBonus = record.tags.some((tag) => query.toLowerCase().includes(tag.toLowerCase()))
    ? 0.15
    : 0;
  const recency = recencyBonus(record.updated);

  return overlap / Math.max(queryTokens.size, 1) + record.importance * 0.35 + tagBonus + recency;
}

export function toRetrieved(record: MemoryRecord, score: number): RetrievedMemory {
  return {
    id: record.id,
    category: record.category,
    path: record.path,
    title: record.title,
    content: record.content,
    tags: record.tags,
    importance: record.importance,
    score,
  };
}

function recencyBonus(updated: string): number {
  const then = Date.parse(updated);
  if (Number.isNaN(then)) return 0;
  const days = (Date.now() - then) / 86_400_000;
  if (days < 7) return 0.12;
  if (days < 30) return 0.06;
  return 0;
}
