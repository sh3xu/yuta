import {
  type ActionName,
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
import { isTauri } from '../lib/tauri-fs';
import {
  broadcastSettings,
  closeWindow,
  currentWindowLabel,
  getOuterPosition,
  getScaleFactor,
  setAlwaysOnTop,
  setOuterPosition,
  showSettingsWindow,
} from '../lib/window';

interface CompanionStore {
  ready: boolean;
  composerOpen: boolean;
  settingsOpen: boolean;
  bubbleVisible: boolean;
  bubbleText: string | null;
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
  gesture: (action: ActionName) => void;
  closeOverlays: () => void;
  openSettings: () => Promise<void>;
  send: (text: string) => Promise<void>;
  saveSettings: (settings: AppSettings, options?: { silent?: boolean }) => Promise<void>;
  patchSettings: (patch: Partial<AppSettings>, options?: { silent?: boolean }) => Promise<void>;
  applyAppearance: (patch: Partial<AppSettings>) => void;
  placeCompanion: (screen?: { x: number; y: number }) => Promise<void>;
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

function hideBubbleLater(
  set: (partial: { bubbleVisible: boolean; bubbleText?: string | null }) => void,
): void {
  clearLingerTimer();
  const ms = BUBBLE_MS > 0 ? BUBBLE_MS : 4500;
  lingerTimer = setTimeout(() => {
    set({ bubbleVisible: false, bubbleText: null });
    lingerTimer = undefined;
  }, ms);
}

export const useCompanionStore = create<CompanionStore>((set, get) => ({
  ready: false,
  composerOpen: false,
  settingsOpen: false,
  bubbleVisible: false,
  bubbleText: null,
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
    session.setStateHandler((characterState) => set({ characterState }));
    const label = await currentWindowLabel();
    set({ ready: true, settings, provider: session.debug.provider });
    if (label === 'main') {
      void session.startSystemAudio();
      void session.startActivity();
      startAsides();
    }
  },

  toggleChat() {
    if (!get().settings.onboardingComplete) return;
    set({ composerOpen: !get().composerOpen });
  },

  gesture(action) {
    session.playAction(action);
    set({
      characterState: session.characterState,
      playedAction: session.characterState.action ?? undefined,
    });
  },

  closeOverlays() {
    set({ composerOpen: false, settingsOpen: false });
  },

  async openSettings() {
    if (!get().settings.onboardingComplete) return;
    if (isTauri()) {
      await showSettingsWindow();
      return;
    }
    set({ settingsOpen: !get().settingsOpen });
  },

  async send(text) {
    const trimmed = text.trim();
    if (!trimmed || get().sending) return;
    clearLingerTimer();
    set({
      sending: true,
      composerOpen: false,
      bubbleVisible: true,
      bubbleText: null,
      lastError: undefined,
      messages: [...get().messages, { role: 'user', content: trimmed }],
    });
    try {
      let replied = false;
      await session.send(
        trimmed,
        (characterState) => set({ characterState }),
        (reply) => {
          const content = reply.trim();
          if (!content) return;
          replied = true;
          set({
            messages: [...get().messages, { role: 'assistant', content }],
            lookupHits: session.debug.loadedMemories,
            behaviorSummary: session.debug.behavior,
            provider: session.debug.provider,
            lastError: session.debug.lastError,
            llmAction: session.debug.llmAction,
            plannedAction: session.debug.plannedAction,
            playedAction: session.debug.playedAction,
            bubbleVisible: true,
            bubbleText: content,
          });
        },
      );
      set({
        lookupHits: session.debug.loadedMemories,
        behaviorSummary: session.debug.behavior,
        provider: session.debug.provider,
        lastError: session.debug.lastError,
        llmAction: session.debug.llmAction,
        plannedAction: session.debug.plannedAction,
        playedAction: session.debug.playedAction,
      });
      if (session.debug.lastError) notifyError(session.debug.lastError);
      if (replied) hideBubbleLater(set);
      else {
        const fallback = 'I could not come up with a reply.';
        set({
          bubbleVisible: true,
          bubbleText: fallback,
          messages: [...get().messages, { role: 'assistant', content: fallback }],
        });
        hideBubbleLater(set);
      }
    } catch (error) {
      const lastError = {
        source: 'ai' as const,
        message: error instanceof Error ? error.message : 'The companion failed to reply.',
        detail: error instanceof Error ? error.stack : String(error),
      };
      console.error('[yuta:ai]', error);
      notifyError(lastError);
      clearLingerTimer();
      set({
        lastError,
        bubbleVisible: false,
        bubbleText: null,
      });
    } finally {
      set({ sending: false });
    }
  },

  async saveSettings(settings, options) {
    await session.persist(settings);
    set({ settings, provider: session.debug.provider });
    await broadcastSettings(settings);
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
    void broadcastSettings(settings);
    if (appearanceTimer !== undefined) clearTimeout(appearanceTimer);
    appearanceTimer = setTimeout(() => {
      void saveSettings(get().settings);
      appearanceTimer = undefined;
    }, 280);
  },

  async placeCompanion(screen?: { x: number; y: number }) {
    const scale = await getScaleFactor();
    const windowX = screen ? Math.round(screen.x * scale) : get().settings.windowX;
    const windowY = screen ? Math.round(screen.y * scale) : get().settings.windowY;
    if (windowX != null && windowY != null) await setOuterPosition(windowX, windowY);
    await get().patchSettings({ positionLocked: true, windowX, windowY }, { silent: true });
    toast({
      variant: 'success',
      title: 'desktop',
      description: 'Placed and locked. Unlock in Settings to move her again.',
    });
  },

  async setPositionLocked(locked) {
    let windowX = get().settings.windowX;
    let windowY = get().settings.windowY;
    if (locked) {
      try {
        const position = await getOuterPosition();
        windowX = position?.x ?? windowX;
        windowY = position?.y ?? windowY;
      } catch (error) {
        console.error('[yuta] position', error);
      }
    }
    await get().patchSettings({ positionLocked: locked, windowX, windowY }, { silent: true });
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

const ASIDE_MIN_MS = 2 * 60 * 1000;
const ASIDE_MAX_MS = 20 * 60 * 1000;
const IDLE_LIMIT_MS = 3 * 60 * 1000;

let asideTimer: ReturnType<typeof setTimeout> | undefined;
let asideRunning = false;
let asidesStarted = false;
let lastLocalInput = Date.now();

function asideDelayMs(): number {
  return ASIDE_MIN_MS + Math.floor(Math.random() * (ASIDE_MAX_MS - ASIDE_MIN_MS));
}

function bindLocalInput(): void {
  const note = () => {
    lastLocalInput = Date.now();
  };
  window.addEventListener('pointerdown', note, true);
  window.addEventListener('keydown', note, true);
}

function systemIdle(): boolean {
  if (document.hidden) return true;
  if (isTauri()) return session.idleMs >= IDLE_LIMIT_MS;
  return Date.now() - lastLocalInput >= IDLE_LIMIT_MS;
}

function asideBlocked(): boolean {
  const state = useCompanionStore.getState();
  return (
    !state.ready ||
    !state.settings.onboardingComplete ||
    state.sending ||
    state.composerOpen ||
    !state.settings.positionLocked ||
    state.bubbleVisible ||
    state.characterState.speaking ||
    asideRunning ||
    systemIdle()
  );
}

function scheduleAside(): void {
  if (asideTimer !== undefined) clearTimeout(asideTimer);
  asideTimer = setTimeout(() => {
    asideTimer = undefined;
    void runAside();
  }, asideDelayMs());
}

async function runAside(): Promise<void> {
  if (asideBlocked()) {
    scheduleAside();
    return;
  }
  asideRunning = true;
  try {
    let replied = false;
    const message = await session.aside(
      (characterState) => useCompanionStore.setState({ characterState }),
      (text) => {
        const content = text.trim();
        if (!content) return;
        replied = true;
        const state = useCompanionStore.getState();
        useCompanionStore.setState({
          messages: [...state.messages, { role: 'assistant', content }],
          lookupHits: session.debug.loadedMemories,
          behaviorSummary: session.debug.behavior,
          provider: session.debug.provider,
          lastError: session.debug.lastError,
          llmAction: session.debug.llmAction,
          plannedAction: session.debug.plannedAction,
          playedAction: session.debug.playedAction,
          bubbleVisible: true,
          bubbleText: content,
        });
      },
    );
    useCompanionStore.setState({
      lookupHits: session.debug.loadedMemories,
      behaviorSummary: session.debug.behavior,
      provider: session.debug.provider,
      lastError: session.debug.lastError,
      llmAction: session.debug.llmAction,
      plannedAction: session.debug.plannedAction,
      playedAction: session.debug.playedAction,
    });
    if (replied && message.trim()) hideBubbleLater(useCompanionStore.setState);
  } catch (error) {
    const lastError = {
      source: 'ai' as const,
      message: error instanceof Error ? error.message : 'The companion failed to reply.',
      detail: error instanceof Error ? error.stack : String(error),
    };
    console.error('[yuta:ai]', error);
    useCompanionStore.setState({ lastError, bubbleVisible: false, bubbleText: null });
  } finally {
    asideRunning = false;
    scheduleAside();
  }
}

function startAsides(): void {
  if (asidesStarted) return;
  asidesStarted = true;
  if (!isTauri()) bindLocalInput();
  scheduleAside();
}

export async function applyAlwaysOnTop(value: boolean): Promise<void> {
  await setAlwaysOnTop(value);
  await useCompanionStore.getState().patchSettings({ alwaysOnTop: value }, { silent: true });
}
