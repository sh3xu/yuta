import {
  type CharacterState,
  type ChatTurn,
  IDLE_CHARACTER_STATE,
  type RetrievedMemory,
} from '@yuta/shared';
import { toast } from '@yuta/ui';
import { create } from 'zustand';
import { type AppError, session } from '../app/session';
import { notifyError } from '../lib/notify';
import { type AppSettings, DEFAULT_SETTINGS } from '../lib/settings';

export type Screen = 'chat' | 'memory' | 'behavior' | 'settings' | 'debug';

interface CompanionStore {
  ready: boolean;
  screen: Screen;
  settings: AppSettings;
  messages: ChatTurn[];
  characterState: CharacterState;
  memories: RetrievedMemory[];
  lookupHits: RetrievedMemory[];
  behaviorSummary: string;
  provider: string;
  lastError?: AppError;
  llmAction?: string;
  plannedAction?: string;
  playedAction?: string;
  sending: boolean;
  init: () => Promise<void>;
  setScreen: (screen: Screen) => void;
  send: (text: string) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  refreshMemories: () => Promise<void>;
  clearMemories: () => Promise<void>;
}

export const useCompanionStore = create<CompanionStore>((set, get) => ({
  ready: false,
  screen: 'chat',
  settings: DEFAULT_SETTINGS,
  messages: [],
  characterState: { ...IDLE_CHARACTER_STATE },
  memories: [],
  lookupHits: [],
  behaviorSummary: '',
  provider: 'mock',
  sending: false,

  async init() {
    const settings = await session.init();
    set({ ready: true, settings, provider: session.debug.provider });
  },

  setScreen(screen) {
    set({ screen });
  },

  async send(text) {
    const trimmed = text.trim();
    if (!trimmed || get().sending) return;
    set({
      sending: true,
      lastError: undefined,
      messages: [...get().messages, { role: 'user', content: trimmed }],
    });
    try {
      const reply = await session.send(trimmed, (characterState) => set({ characterState }));
      set({
        messages: [...get().messages, { role: 'assistant', content: reply }],
        lookupHits: session.debug.loadedMemories,
        behaviorSummary: session.debug.behavior,
        provider: session.debug.provider,
        lastError: session.debug.lastError,
        llmAction: session.debug.llmAction,
        plannedAction: session.debug.plannedAction,
        playedAction: session.debug.playedAction,
      });
      if (session.debug.lastError) notifyError(session.debug.lastError);
    } catch (error) {
      const lastError = {
        source: 'ai' as const,
        message: error instanceof Error ? error.message : 'The companion failed to reply.',
        detail: error instanceof Error ? error.stack : String(error),
      };
      console.error('[yuta:ai]', error);
      set({ lastError });
      notifyError(lastError);
    } finally {
      set({ sending: false });
    }
  },

  async saveSettings(settings) {
    await session.persist(settings);
    set({ settings, provider: session.debug.provider });
    toast({ variant: 'success', title: 'settings', description: 'Saved on this machine.' });
  },

  async refreshMemories() {
    const records = (await session.memory?.list()) ?? [];
    set({
      memories: records.map((record) => ({
        id: record.id,
        category: record.category,
        path: record.path,
        title: record.title,
        content: record.content,
        tags: record.tags,
        importance: record.importance,
        score: record.importance,
      })),
    });
  },

  async clearMemories() {
    await session.memory?.clear();
    set({ memories: [], lookupHits: [] });
  },
}));
