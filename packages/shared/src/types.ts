import type { ActionName, DanceMoveName, EmotionName, MemoryCategory } from './constants';

export interface CharacterState {
  emotion: EmotionName;
  emotionIntensity: number;
  action: ActionName | null;
  actionIntensity: number;
  actionToken: number;
  speaking: boolean;
  mouthOpen: number;
  dancing: boolean;
  danceMove: DanceMoveName | null;
  musicEnergy: number;
  bassEnergy: number;
  beatPulse: number;
  musicBpm: number;
}

export interface EmotionSignal {
  name: EmotionName;
  intensity: number;
}

export interface ActionSignal {
  name: ActionName;
  intensity: number;
}

export interface MemoryFact {
  category: MemoryCategory;
  topic?: string;
  content: string;
}

export interface MemoryWriteHint {
  shouldStore: boolean;
  facts?: MemoryFact[];
  category?: MemoryCategory;
  topic?: string;
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
  dancing: false,
  danceMove: null,
  musicEnergy: 0,
  bassEnergy: 0,
  beatPulse: 0,
  musicBpm: 0,
};

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
