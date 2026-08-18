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
import { type AppSettings, DEFAULT_SETTINGS, saveSettings } from '../lib/settings';
import { BUBBLE_MS } from '../lib/sticker';
import { closeWindow, getOuterPosition, setAlwaysOnTop } from '../lib/window';

export type SettingsHud = 'scale' | 'crop' | 'dock' | 'profile' | 'ai' | null;

interface CompanionStore {
  ready: boolean;
  chatOpen: boolean;
  settingsOpen: boolean;
  settingsHud: SettingsHud;
  bubbleVisible: boolean;
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
  toggleChat: () => void;
  closeOverlays: () => void;
  openSettings: () => void;
  setSettingsHud: (hud: SettingsHud) => void;
  send: (text: string) => Promise<void>;
  saveSettings: (settings: AppSettings, options?: { silent?: boolean }) => Promise<void>;
  patchSettings: (patch: Partial<AppSettings>, options?: { silent?: boolean }) => Promise<void>;
  applyAppearance: (patch: Partial<AppSettings>) => void;
  placeCompanion: () => Promise<void>;
  setPositionLocked: (locked: boolean) => Promise<void>;
  quit: () => Promise<void>;
  refreshMemories: () => Promise<void>;
  clearMemories: () => Promise<void>;
}

let lingerTimer: ReturnType<typeof setTimeout> | undefined;
let appearanceTimer: ReturnType<typeof setTimeout> | undefined;

function clearLingerTimer(): void {
  if (lingerTimer !== undefined) {
    clearTimeout(lingerTimer);
    lingerTimer = undefined;
  }
}

function hideBubbleLater(set: (partial: { bubbleVisible: boolean }) => void): void {
  clearLingerTimer();
  lingerTimer = setTimeout(() => {
    set({ bubbleVisible: false });
    lingerTimer = undefined;
  }, BUBBLE_MS);
}

export const useCompanionStore = create<CompanionStore>((set, get) => ({
  ready: false,
  chatOpen: false,
  settingsOpen: false,
  settingsHud: null,
  bubbleVisible: false,
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

  toggleChat() {
    if (!get().settings.onboardingComplete) return;
    if (get().chatOpen) {
      get().closeOverlays();
      return;
    }
    set({ chatOpen: true });
  },

  closeOverlays() {
    clearLingerTimer();
    set({ chatOpen: false, settingsOpen: false, settingsHud: null, bubbleVisible: false });
  },

  openSettings() {
    if (!get().settings.onboardingComplete) return;
    if (get().settingsOpen) {
      set({ settingsOpen: false, settingsHud: null });
      return;
    }
    set({ chatOpen: true, settingsOpen: true });
  },

  setSettingsHud(settingsHud) {
    set({ settingsOpen: true, chatOpen: true, settingsHud });
  },

  async send(text) {
    const trimmed = text.trim();
    if (!trimmed || get().sending) return;
    clearLingerTimer();
    set({
      sending: true,
      chatOpen: true,
      bubbleVisible: true,
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
      if (get().chatOpen) hideBubbleLater(set);
      else set({ bubbleVisible: false });
    } catch (error) {
      const lastError = {
        source: 'ai' as const,
        message: error instanceof Error ? error.message : 'The companion failed to reply.',
        detail: error instanceof Error ? error.stack : String(error),
      };
      console.error('[yuta:ai]', error);
      set({ lastError, bubbleVisible: false });
      notifyError(lastError);
    } finally {
      set({ sending: false });
    }
  },

  async saveSettings(settings, options) {
    await session.persist(settings);
    set({ settings, provider: session.debug.provider });
    if (!options?.silent) {
      toast({ variant: 'success', title: 'settings', description: 'Saved on this machine.' });
    }
  },

  async patchSettings(patch, options) {
    await get().saveSettings({ ...get().settings, ...patch }, options);
  },

  applyAppearance(patch) {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    if (appearanceTimer !== undefined) clearTimeout(appearanceTimer);
    appearanceTimer = setTimeout(() => {
      void saveSettings(get().settings);
      appearanceTimer = undefined;
    }, 280);
  },

  async placeCompanion() {
    const position = await getOuterPosition();
    await get().patchSettings(
      {
        positionLocked: true,
        windowX: position?.x ?? get().settings.windowX,
        windowY: position?.y ?? get().settings.windowY,
      },
      { silent: true },
    );
    toast({
      variant: 'success',
      title: 'desktop',
      description: 'Placed. Unlock in settings to move again.',
    });
  },

  async setPositionLocked(locked) {
    const position = locked ? await getOuterPosition() : null;
    await get().patchSettings(
      {
        positionLocked: locked,
        windowX: position?.x ?? get().settings.windowX,
        windowY: position?.y ?? get().settings.windowY,
      },
      { silent: true },
    );
  },

  async quit() {
    await closeWindow();
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

export async function applyAlwaysOnTop(value: boolean): Promise<void> {
  await setAlwaysOnTop(value);
  await useCompanionStore.getState().patchSettings({ alwaysOnTop: value }, { silent: true });
}
