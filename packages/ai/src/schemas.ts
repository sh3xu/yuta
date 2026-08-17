import {
  ACTIONS,
  EMOTIONS,
  MEMORY_CATEGORIES,
  type AIResponse,
  type ActionName,
  type EmotionName,
  clamp01,
} from '@yuta/shared';
import { z } from 'zod';

export const emotionSignalSchema = z.object({
  name: z.enum(EMOTIONS),
  intensity: z.number().min(0).max(1),
});

export const actionSignalSchema = z.object({
  name: z.enum(ACTIONS),
  intensity: z.number().min(0).max(1),
});

export const memoryWriteHintSchema = z.object({
  shouldStore: z.boolean(),
  category: z.enum(MEMORY_CATEGORIES).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const aiResponseSchema = z.object({
  message: z.string().min(1),
  emotion: emotionSignalSchema,
  action: actionSignalSchema.optional(),
  memory: memoryWriteHintSchema.optional(),
});

export const geminiJsonSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    emotion: {
      type: 'object',
      properties: {
        name: { type: 'string', enum: [...EMOTIONS] },
        intensity: { type: 'number' },
      },
      required: ['name', 'intensity'],
    },
    action: {
      type: 'object',
      properties: {
        name: { type: 'string', enum: [...ACTIONS] },
        intensity: { type: 'number' },
      },
      required: ['name', 'intensity'],
    },
    memory: {
      type: 'object',
      properties: {
        shouldStore: { type: 'boolean' },
        category: { type: 'string', enum: [...MEMORY_CATEGORIES] },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['shouldStore'],
    },
  },
  required: ['message', 'emotion', 'action'],
} as const;

export function parseAIResponse(input: unknown): AIResponse {
  const normalized = normalizePayload(input);
  const parsed = aiResponseSchema.safeParse(normalized);
  if (parsed.success) {
    return {
      ...parsed.data,
      emotion: {
        name: parsed.data.emotion.name,
        intensity: clamp01(parsed.data.emotion.intensity),
      },
      action: parsed.data.action
        ? {
            name: parsed.data.action.name,
            intensity: clamp01(parsed.data.action.intensity),
          }
        : undefined,
    };
  }

  const message =
    typeof normalized === 'object' &&
    normalized &&
    'message' in normalized &&
    typeof normalized.message === 'string'
      ? normalized.message
      : 'I heard you, but my reply came back in a shape I could not use.';

  return {
    message,
    emotion: coerceEmotion(normalized) ?? { name: 'neutral', intensity: 0.4 },
    action: coerceAction(normalized),
  };
}

export function parseAIResponseText(text: string): AIResponse {
  const trimmed = text.trim();
  const json = extractJson(trimmed);
  try {
    return parseAIResponse(JSON.parse(json) as unknown);
  } catch {
    return parseAIResponse({ message: trimmed, emotion: { name: 'neutral', intensity: 0.4 } });
  }
}

function normalizePayload(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  const raw = input as Record<string, unknown>;
  return {
    ...raw,
    emotion: coerceEmotion(raw) ?? raw.emotion,
    action: coerceAction(raw) ?? raw.action,
  };
}

function coerceEmotion(input: unknown): AIResponse['emotion'] | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const raw = input as Record<string, unknown>;
  const value = raw.emotion ?? raw.Emotion;
  if (typeof value === 'string') {
    const name = matchEnum(value, EMOTIONS);
    return name ? { name, intensity: 0.7 } : undefined;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const name = matchEnum(String(record.name ?? record.Name ?? ''), EMOTIONS);
    if (!name) return undefined;
    return { name, intensity: normalizeIntensity(record.intensity ?? record.Intensity) };
  }
  return undefined;
}

function coerceAction(input: unknown): AIResponse['action'] | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const raw = input as Record<string, unknown>;
  const value = raw.action ?? raw.Action;
  if (typeof value === 'string') {
    const name = matchEnum(value, ACTIONS);
    return name ? { name, intensity: 0.85 } : undefined;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const name = matchEnum(String(record.name ?? record.Name ?? ''), ACTIONS);
    if (!name) return undefined;
    return { name, intensity: normalizeIntensity(record.intensity ?? record.Intensity, 0.85) };
  }
  return undefined;
}

function matchEnum<T extends string>(value: string, options: readonly T[]): T | undefined {
  const needle = value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return options.find((option) => option.toLowerCase() === needle);
}

function normalizeIntensity(value: unknown, fallback = 0.7): number {
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  if (number > 1) return clamp01(number / 100);
  return clamp01(number);
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}
