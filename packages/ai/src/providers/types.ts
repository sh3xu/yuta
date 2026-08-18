import type { AIRequest, AIResponse, MemoryCategory, RetrievedMemory } from '@yuta/shared';

export type MemoryLookup = (query: string, category?: MemoryCategory) => Promise<RetrievedMemory[]>;

export interface AIGenerateOptions {
  lookupMemory?: MemoryLookup;
}

export interface AIProvider {
  readonly id: string;
  generate(request: AIRequest, options?: AIGenerateOptions): Promise<AIResponse>;
}
