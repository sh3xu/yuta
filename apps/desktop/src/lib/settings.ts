import { APP_ID, DEFAULT_COMPANION_NAME, DEFAULT_GEMINI_MODEL } from '@yuta/shared';
import { isTauri } from './tauri-fs';

export type InputCorner = 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom';

export interface AppSettings {
  companionName: string;
  personality: string;
  geminiApiKey: string;
  geminiModel: string;
  voiceEnabled: boolean;
  voiceName: string;
  onboardingComplete: boolean;
  positionLocked: boolean;
  windowX: number | null;
  windowY: number | null;
  alwaysOnTop: boolean;
  modelScale: number;
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  dockWidth: number;
  dockGap: number;
  dockOffsetY: number;
  followCursor: boolean;
  inputCorner: InputCorner;
}

export const INPUT_CORNERS: InputCorner[] = [
  'left-top',
  'right-top',
  'left-bottom',
  'right-bottom',
];

export const DEFAULT_SETTINGS: AppSettings = {
  companionName: DEFAULT_COMPANION_NAME,
  personality:
    'A warm, slightly teasing friend who remembers what matters and keeps answers grounded.',
  geminiApiKey: '',
  geminiModel: DEFAULT_GEMINI_MODEL,
  voiceEnabled: true,
  voiceName: '',
  onboardingComplete: false,
  positionLocked: false,
  windowX: null,
  windowY: null,
  alwaysOnTop: true,
  modelScale: 1,
  cropTop: 0,
  cropBottom: 0,
  cropLeft: 0,
  cropRight: 0,
  dockWidth: 240,
  dockGap: 2,
  dockOffsetY: 0,
  followCursor: true,
  inputCorner: 'left-top',
};

const KEY = `${APP_ID}-settings`;

export async function loadSettings(): Promise<AppSettings> {
  if (isTauri()) {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load('settings.json');
    const value = (await store.get<AppSettings>('settings')) ?? DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...value };
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (isTauri()) {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load('settings.json');
    await store.set('settings', settings);
    await store.save();
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(settings));
}
