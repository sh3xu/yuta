import { type Content, type FunctionCall, GoogleGenAI, type Part } from '@google/genai';
import { type AIRequest, type AIResponse, DEFAULT_GEMINI_MODEL } from '@yuta/shared';
import { buildSystemPrompt, buildUserPrompt } from '../prompts';
import { geminiJsonSchema, parseAIResponseText } from '../schemas';
import {
  LOOKUP_MEMORY_TOOL_NAME,
  lookupMemoryDeclaration,
  parseLookupMemoryArgs,
} from '../tools/lookup-memory';
import type { AIGenerateOptions, AIProvider, MemoryLookup } from './types';

const MAX_LOOKUP_ROUNDS = 4;

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

  async generate(request: AIRequest, options?: AIGenerateOptions): Promise<AIResponse> {
    const systemInstruction = buildSystemPrompt(request);
    const contents: Content[] = [{ role: 'user', parts: [{ text: buildUserPrompt(request) }] }];

    if (!options?.lookupMemory) {
      return this.finalizeJson(contents, systemInstruction);
    }

    for (let round = 0; round < MAX_LOOKUP_ROUNDS; round += 1) {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [lookupMemoryDeclaration] }],
          temperature: 0.8,
        },
      });

      const calls = response.functionCalls ?? [];
      if (calls.length === 0) {
        const text = response.text?.trim() ?? '';
        if (looksLikeJsonReply(text)) {
          return parseAIResponseText(text);
        }
        if (text) {
          contents.push({ role: 'model', parts: [{ text }] });
        }
        break;
      }

      contents.push({
        role: 'model',
        parts: calls.map((call) => ({ functionCall: call })),
      });
      contents.push({
        role: 'user',
        parts: await Promise.all(
          calls.map((call) => runLookupCall(call, options.lookupMemory as MemoryLookup)),
        ),
      });
    }

    return this.finalizeJson(contents, systemInstruction);
  }

  private async finalizeJson(contents: Content[], systemInstruction: string): Promise<AIResponse> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: geminiJsonSchema,
        temperature: 0.8,
      },
    });

    return parseAIResponseText(response.text ?? '');
  }
}

function looksLikeJsonReply(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('{') && trimmed.includes('"message"');
}

async function runLookupCall(call: FunctionCall, lookupMemory: MemoryLookup): Promise<Part> {
  const name = call.name ?? LOOKUP_MEMORY_TOOL_NAME;
  if (name !== LOOKUP_MEMORY_TOOL_NAME) {
    return {
      functionResponse: {
        name,
        id: call.id,
        response: { error: `Unknown tool: ${name}` },
      },
    };
  }

  const { query, category } = parseLookupMemoryArgs(call.args);
  if (!query) {
    return {
      functionResponse: {
        name,
        id: call.id,
        response: { hits: [], note: 'query is required' },
      },
    };
  }

  const hits = await lookupMemory(query, category);
  return {
    functionResponse: {
      name,
      id: call.id,
      response: {
        hits: hits.map((hit) => ({
          title: hit.title,
          category: hit.category,
          content: hit.content,
          tags: hit.tags,
        })),
      },
    },
  };
}
