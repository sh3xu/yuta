import { GoogleGenAI } from '@google/genai';
import { DEFAULT_GEMINI_MODEL, type AIRequest, type AIResponse } from '@yuta/shared';
import { buildSystemPrompt, buildUserPrompt } from '../prompts';
import { geminiJsonSchema, parseAIResponseText } from '../schemas';
import type { AIProvider } from './types';

export interface GeminiProviderOptions {
  apiKey: string;
  model?: string;
}

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini';
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(options: GeminiProviderOptions) {
    this.client = new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model ?? DEFAULT_GEMINI_MODEL;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: buildUserPrompt(request),
      config: {
        systemInstruction: buildSystemPrompt(request),
        responseMimeType: 'application/json',
        responseSchema: geminiJsonSchema,
        temperature: 0.8,
      },
    });

    return parseAIResponseText(response.text ?? '');
  }
}
