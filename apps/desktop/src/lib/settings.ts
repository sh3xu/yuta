import { APP_ID, DEFAULT_COMPANION_NAME, DEFAULT_GEMINI_MODEL } from '@yuta/shared';
import { isTauri } from './tauri-fs';

export interface AppSettings {
  companionName: string;
  personality: string;
  geminiApiKey: string;
  geminiModel: string;
  voiceEnabled: boolean;
  voiceName: string;
  onboardingComplete: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  companionName: DEFAULT_COMPANION_NAME,
  personality: 'A warm, slightly teasing friend who remembers what matters and keeps answers grounded.',
  geminiApiKey: '',
  geminiModel: DEFAULT_GEMINI_MODEL,
  voiceEnabled: true,
  voiceName: '',
  onboardingComplete: false,
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
