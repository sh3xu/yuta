import { GeminiProvider } from './gemini';
import { MockProvider } from './mock';
import type { AIProvider } from './types';

export function createAIProvider(options: {
  apiKey?: string;
  model?: string;
}): AIProvider {
  if (options.apiKey?.trim()) {
    return new GeminiProvider({ apiKey: options.apiKey.trim(), model: options.model });
  }
  return new MockProvider();
}
