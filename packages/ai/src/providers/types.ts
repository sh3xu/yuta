import type { AIRequest, AIResponse } from '@yuta/shared';

export interface AIProvider {
  readonly id: string;
  generate(request: AIRequest): Promise<AIResponse>;
}
