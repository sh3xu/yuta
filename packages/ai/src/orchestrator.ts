import type { AIProvider } from './providers/types';
import type { AIRequest, AIResponse, RetrievedMemory } from '@yuta/shared';
import { RECENT_TURN_LIMIT } from '@yuta/shared';
import type { BehaviorTracker } from '@yuta/behavior';
import type { MemoryService } from '@yuta/memory';
import { EmotionEngine, planAction } from '@yuta/emotion-engine';

export interface OrchestratorDeps {
  provider: AIProvider;
  memory: MemoryService;
  behavior: BehaviorTracker;
  emotion: EmotionEngine;
}

export class Orchestrator {
  constructor(private readonly deps: OrchestratorDeps) {}

  async respond(input: {
    companionName: string;
    personality: string;
    userMessage: string;
    history: AIRequest['history'];
  }): Promise<{
    response: AIResponse;
    memories: RetrievedMemory[];
    characterState: ReturnType<EmotionEngine['apply']>;
    plannedAction?: AIResponse['action'];
  }> {
    const memories = await this.deps.memory.retrieve(input.userMessage);
    const plannedAction = planAction(input.userMessage);
    const request: AIRequest = {
      companionName: input.companionName,
      personality: input.personality,
      userMessage: input.userMessage,
      history: input.history.slice(-RECENT_TURN_LIMIT),
      memories,
      behavior: this.deps.behavior.getHint(),
      emotion: this.deps.emotion.currentEmotion(),
    };

    const generated = await this.deps.provider.generate(request);
    const response: AIResponse = {
      ...generated,
      action: plannedAction ?? generated.action,
    };
    this.deps.behavior.observe(input.userMessage, 'user');
    this.deps.behavior.observe(response.message, 'assistant');

    if (response.memory?.shouldStore && response.memory.content) {
      await this.deps.memory.write({
        category: response.memory.category ?? 'knowledge',
        content: response.memory.content,
        tags: response.memory.tags ?? [],
        importance: 0.7,
      });
    }

    const characterState = this.deps.emotion.apply({
      emotion: response.emotion,
      action: response.action,
    });

    return { response, memories, characterState, plannedAction };
  }
}

export interface OrchestratorDeps {
  provider: AIProvider;
  memory: MemoryService;
  behavior: BehaviorTracker;
  emotion: EmotionEngine;
}

export class Orchestrator {
  constructor(private readonly deps: OrchestratorDeps) {}

  async respond(input: {
    companionName: string;
    personality: string;
    userMessage: string;
    history: AIRequest['history'];
  }): Promise<{
    response: AIResponse;
    memories: RetrievedMemory[];
    characterState: ReturnType<EmotionEngine['apply']>;
  }> {
    const memories = await this.deps.memory.retrieve(input.userMessage);
    const request: AIRequest = {
      companionName: input.companionName,
      personality: input.personality,
      userMessage: input.userMessage,
      history: input.history.slice(-RECENT_TURN_LIMIT),
      memories,
      behavior: this.deps.behavior.getHint(),
      emotion: this.deps.emotion.currentEmotion(),
    };

    const response = await this.deps.provider.generate(request);
    this.deps.behavior.observe(input.userMessage, 'user');
    this.deps.behavior.observe(response.message, 'assistant');

    if (response.memory?.shouldStore && response.memory.content) {
      await this.deps.memory.write({
        category: response.memory.category ?? 'knowledge',
        content: response.memory.content,
        tags: response.memory.tags ?? [],
        importance: 0.7,
      });
    }

    const characterState = this.deps.emotion.apply({
      emotion: response.emotion,
      action: response.action,
    });

    return { response, memories, characterState };
  }
}
