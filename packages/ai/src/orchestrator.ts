import type { BehaviorTracker } from '@yuta/behavior';
import { type EmotionEngine, planAction } from '@yuta/emotion-engine';
import { type MemoryService, memoriesFromHint } from '@yuta/memory';
import type { AIRequest, AIResponse, RetrievedMemory } from '@yuta/shared';
import { RECENT_TURN_LIMIT } from '@yuta/shared';
import type { AIProvider } from './providers/types';

export interface OrchestratorDeps {
  provider: AIProvider;
  memory: MemoryService;
  behavior: BehaviorTracker;
  emotion: EmotionEngine;
}

export class Orchestrator {
  constructor(private readonly deps: OrchestratorDeps) {}

  aside(input: {
    companionName: string;
    personality: string;
    history: AIRequest['history'];
  }): Promise<Awaited<ReturnType<Orchestrator['respond']>>> {
    return this.respond({ ...input, userMessage: '', aside: true });
  }

  async respond(input: {
    companionName: string;
    personality: string;
    userMessage: string;
    aside?: boolean;
    history: AIRequest['history'];
  }): Promise<{
    response: AIResponse;
    memories: RetrievedMemory[];
    characterState: ReturnType<EmotionEngine['apply']>;
    plannedAction?: AIResponse['action'];
    llmAction?: AIResponse['action'];
  }> {
    const plannedAction = input.aside ? undefined : planAction(input.userMessage);
    const lookups = new Map<string, RetrievedMemory>();
    const request: AIRequest = {
      companionName: input.companionName,
      personality: input.personality,
      userMessage: input.userMessage,
      aside: input.aside,
      history: input.history.slice(-RECENT_TURN_LIMIT),
      memories: [],
      behavior: this.deps.behavior.getHint(),
      emotion: this.deps.emotion.currentEmotion(),
    };

    const generated = await this.deps.provider.generate(request, {
      lookupMemory: async (query, category) => {
        const hits = await this.deps.memory.retrieve(query, category);
        for (const hit of hits) lookups.set(hit.id, hit);
        return hits;
      },
    });
    const response: AIResponse = {
      ...generated,
      message: input.aside ? oneLine(generated.message) : generated.message,
      action: plannedAction ?? generated.action,
      memory: input.aside ? { shouldStore: false } : generated.memory,
    };
    if (!input.aside) this.deps.behavior.observe(input.userMessage, 'user');
    this.deps.behavior.observe(response.message, 'assistant');

    if (!input.aside) {
      for (const fact of memoriesFromHint(response.memory)) {
        await this.deps.memory.write(fact);
      }
    }

    const characterState = this.deps.emotion.apply({
      emotion: response.emotion,
      action: response.action,
    });

    return {
      response,
      memories: [...lookups.values()],
      characterState,
      plannedAction,
      llmAction: generated.action,
    };
  }
}

function oneLine(message: string): string {
  const trimmed = message.replace(/\s+/g, ' ').trim();
  const sentence = trimmed.split(/(?<=[.!?])\s+/)[0] ?? trimmed;
  const words = sentence.split(' ').filter(Boolean);
  if (words.length <= 14) return sentence;
  return `${words.slice(0, 12).join(' ')}.`;
}
