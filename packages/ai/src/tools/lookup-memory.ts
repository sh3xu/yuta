import { type FunctionDeclaration, Type } from '@google/genai';
import { isMemoryCategory, MEMORY_CATEGORIES, type MemoryCategory } from '@yuta/shared';

export const LOOKUP_MEMORY_TOOL_NAME = 'lookup_memory';

export const lookupMemoryDeclaration: FunctionDeclaration = {
  name: LOOKUP_MEMORY_TOOL_NAME,
  description:
    'Search local companion memory for a specific fact, person, preference, or past event. Call only when the recent conversation is not enough. Do not request a dump of all memories.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'Short search phrase, such as a name, preference, or event.',
      },
      category: {
        type: Type.STRING,
        description: 'Optional memory folder to search. Omit unless you know the kind of fact.',
        enum: [...MEMORY_CATEGORIES],
      },
    },
    required: ['query'],
  },
};

export function parseLookupMemoryArgs(args: unknown): {
  query: string;
  category?: MemoryCategory;
} {
  const record = args && typeof args === 'object' ? (args as Record<string, unknown>) : {};
  const query = typeof record.query === 'string' ? record.query.trim() : '';
  const category = isMemoryCategory(record.category) ? record.category : undefined;
  return { query, category };
}
