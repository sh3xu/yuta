import type { MemoryCategory } from '@yuta/shared';

const HINTS: Array<{ category: MemoryCategory; pattern: RegExp }> = [
  { category: 'people', pattern: /\b(mom|dad|friend|sister|brother|they|who is|named)\b/i },
  {
    category: 'preferences',
    pattern: /\b(like|prefer|favorite|hate|always|never|rather)\b/i,
  },
  {
    category: 'experiences',
    pattern: /\b(yesterday|last week|remember when|happened|today|ago|decided)\b/i,
  },
  { category: 'profile', pattern: /\b(my name|i am|i'm|i live)\b/i },
  { category: 'private', pattern: /\b(secret|private|don't tell|confidential)\b/i },
  { category: 'knowledge', pattern: /\b(project|work|code|build|fact|about)\b/i },
];

export function routeCategory(query: string): MemoryCategory {
  return HINTS.find((hint) => hint.pattern.test(query))?.category ?? 'knowledge';
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}
