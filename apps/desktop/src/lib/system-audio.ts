import { isTauri } from './tauri-fs';

export const SYSTEM_AUDIO_EVENT = 'system-audio';

export interface SystemAudioFrame {
  playing: boolean;
  energy: number;
  bass: number;
  mid: number;
  treble: number;
  beatPulse: number;
  beatIndex: number;
  bpm: number;
  source?: string;
}

export async function subscribeSystemAudio(
  handler: (frame: SystemAudioFrame) => void,
): Promise<() => void> {
  if (!isTauri()) return () => undefined;
  const { listen } = await import('@tauri-apps/api/event');
  return listen<SystemAudioFrame>(SYSTEM_AUDIO_EVENT, (event) => handler(event.payload));
}
