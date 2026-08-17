import type { ActionName, EmotionName, MemoryCategory } from './constants';

export interface CharacterState {
  emotion: EmotionName;
  emotionIntensity: number;
  action: ActionName | null;
  actionIntensity: number;
  actionToken: number;
  speaking: boolean;
  mouthOpen: number;
}

export interface EmotionSignal {
  name: EmotionName;
  intensity: number;
}

export interface ActionSignal {
  name: ActionName;
  intensity: number;
}

export interface MemoryWriteHint {
  shouldStore: boolean;
  category?: MemoryCategory;
  content?: string;
  tags?: string[];
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface RetrievedMemory {
  id: string;
  category: MemoryCategory;
  path: string;
  title: string;
  content: string;
  tags: string[];
  importance: number;
  score: number;
}

export interface BehaviorHint {
  verbosity: 'low' | 'medium' | 'high';
  tone: 'warm' | 'direct' | 'playful';
  avoid: string[];
  summary: string;
}

export interface AIRequest {
  companionName: string;
  personality: string;
  userMessage: string;
  history: ChatTurn[];
  memories: RetrievedMemory[];
  behavior: BehaviorHint;
  emotion: EmotionSignal;
}

export interface AIResponse {
  message: string;
  emotion: EmotionSignal;
  action?: ActionSignal;
  memory?: MemoryWriteHint;
}

export const IDLE_CHARACTER_STATE: CharacterState = {
  emotion: 'neutral',
  emotionIntensity: 0.35,
  action: 'idle',
  actionIntensity: 0.4,
  actionToken: 0,
  speaking: false,
  mouthOpen: 0,
};

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
