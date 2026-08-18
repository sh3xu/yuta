import { isMemoryCategory, type MemoryCategory, type MemoryWriteHint } from '@yuta/shared';
import { type NewMemory, slugify } from './format';

export const MAX_FACT_CHARS = 60;
export const MAX_FACTS_PER_TURN = 4;

export function memoriesFromHint(hint?: MemoryWriteHint): NewMemory[] {
  if (!hint?.shouldStore) return [];

  const raw = hint.facts?.length
    ? hint.facts
    : splitContent(hint.content).map((content) => ({
        category: hint.category,
        topic: hint.topic,
        content,
      }));

  const facts: NewMemory[] = [];
  for (const item of raw) {
    const content = compactFact(item.content);
    if (!content) continue;
    const category = isMemoryCategory(item.category)
      ? item.category
      : isMemoryCategory(hint.category)
        ? hint.category
        : undefined;
    if (!category) continue;
    facts.push({
      category,
      topic: inferTopic(category, content, item.topic ?? hint.topic),
      content,
      tags: hint.tags,
    });
    if (facts.length >= MAX_FACTS_PER_TURN) break;
  }
  return facts;
}

export function compactFact(text: string): string {
  return text
    .trim()
    .replace(/^(the user|user|i)\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[.!,;:]+$/g, '')
    .slice(0, MAX_FACT_CHARS);
}

export function inferTopic(
  category: MemoryCategory,
  content: string,
  explicit?: string,
): string | undefined {
  const given = topicSlug(explicit);
  if (given) return given;
  const text = content.toLowerCase();
  if (category === 'preferences') {
    if (/\b(dislike|hate|avoid|allergic)\b/.test(text) || /\bdon'?t like\b/.test(text)) {
      return 'dislikes';
    }
    if (/\b(fav|favorite|like|love|prefer)\b/.test(text)) return 'likes';
  }
  if (category === 'profile') {
    if (/\bname\b/.test(text)) return 'name';
    if (/\b(live|city|hometown|from)\b/.test(text)) return 'location';
    if (/\b(job|work|role)\b/.test(text)) return 'job';
  }
  return undefined;
}

export function factSlug(content: string): string {
  const stripped = content
    .toLowerCase()
    .replace(/^(dislike|hate|avoid|fav(?:orite)?|like|love|prefer)\s+/i, '');
  return slugify(stripped || content).slice(0, 40);
}

export function topicSlug(value?: string): string | undefined {
  if (!value) return undefined;
  const slug = slugify(value).slice(0, 24);
  return slug || undefined;
}

function splitContent(content?: string): string[] {
  if (!content) return [];
  return content
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}
