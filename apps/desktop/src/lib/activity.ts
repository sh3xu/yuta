import { isTauri } from './tauri-fs';

export const DESKTOP_ACTIVITY_EVENT = 'desktop-activity';

export interface DesktopActivity {
  idleMs: number;
  musicPlaying: boolean;
}

export async function subscribeDesktopActivity(
  handler: (activity: DesktopActivity) => void,
): Promise<() => void> {
  if (!isTauri()) return () => undefined;
  const { listen } = await import('@tauri-apps/api/event');
  return listen<DesktopActivity>(DESKTOP_ACTIVITY_EVENT, (event) => handler(event.payload));
}
