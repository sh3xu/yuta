import type { AppSettings } from './settings';
import { characterInsetX, SETTINGS_CHANGED_EVENT, type StickerMode, stickerSize } from './sticker';
import { isTauri } from './tauri-fs';

export const SET_POSITION_LOCKED_EVENT = 'set-position-locked';
export const SETTINGS_WINDOW_LABEL = 'settings';
export const MAIN_WINDOW_LABEL = 'main';

async function stickerWindow() {
  const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
  return WebviewWindow.getByLabel(MAIN_WINDOW_LABEL);
}

export async function setStickerSize(
  mode: StickerMode,
  settings: AppSettings,
  previous?: { mode: StickerMode; settings: AppSettings },
): Promise<void> {
  if (!isTauri()) return;
  const { LogicalSize, PhysicalPosition } = await import('@tauri-apps/api/dpi');
  const window = await stickerWindow();
  if (!window) return;
  const next = stickerSize(mode, settings);
  const scale = await window.scaleFactor();
  const position = await window.outerPosition();
  const oldInset = previous
    ? characterInsetX(previous.mode, previous.settings)
    : characterInsetX(mode, settings);
  const newInset = characterInsetX(mode, settings);
  const dx = (newInset - oldInset) * scale;
  await window.setSize(new LogicalSize(next.width, next.height));
  await window.setPosition(new PhysicalPosition(Math.round(position.x - dx), position.y));
}

export async function setAlwaysOnTop(value: boolean): Promise<void> {
  if (!isTauri()) return;
  const window = await stickerWindow();
  if (!window) return;
  await window.setAlwaysOnTop(value);
}

export async function getOuterPosition(): Promise<{ x: number; y: number } | null> {
  if (!isTauri()) return null;
  const window = await stickerWindow();
  if (!window) return null;
  const position = await window.outerPosition();
  return { x: position.x, y: position.y };
}

export async function getScaleFactor(): Promise<number> {
  if (!isTauri()) return window.devicePixelRatio || 1;
  const current = await stickerWindow();
  if (!current) return window.devicePixelRatio || 1;
  return await current.scaleFactor();
}

export async function setOuterPosition(x: number, y: number): Promise<void> {
  if (!isTauri()) return;
  const { PhysicalPosition } = await import('@tauri-apps/api/dpi');
  const window = await stickerWindow();
  if (!window) return;
  await window.setPosition(new PhysicalPosition(x, y));
}

export async function setIgnoreCursorEvents(ignore: boolean): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const current = getCurrentWindow();
  if (current.label !== MAIN_WINDOW_LABEL) return;
  await current.setIgnoreCursorEvents(ignore);
}

export async function closeWindow(): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().close();
}

export async function requestPositionLocked(locked: boolean): Promise<void> {
  if (!isTauri()) return;
  const { emit } = await import('@tauri-apps/api/event');
  await emit(SET_POSITION_LOCKED_EVENT, { locked });
}

export async function subscribePositionLocked(
  handler: (locked: boolean) => void,
): Promise<() => void> {
  if (!isTauri()) return () => undefined;
  const { listen } = await import('@tauri-apps/api/event');
  return listen<{ locked: boolean }>(SET_POSITION_LOCKED_EVENT, (event) => {
    handler(event.payload.locked);
  });
}

export async function subscribePointerGesture(
  handler: (gesture: { kind: 'left' | 'right' | 'wheel'; delta: number; x: number; y: number }) => void,
): Promise<() => void> {
  if (!isTauri()) return () => undefined;
  const { listen } = await import('@tauri-apps/api/event');
  return listen<{ kind: 'left' | 'right' | 'wheel'; delta: number; x: number; y: number }>(
    'pointer-gesture',
    (event) => handler(event.payload),
  );
}

export async function subscribeCursorMove(
  handler: (point: {
    x: number;
    y: number;
    screenX?: number;
    screenY?: number;
    screenW?: number;
    screenH?: number;
  }) => void,
): Promise<() => void> {
  if (!isTauri()) {
    const onMove = (event: MouseEvent) => handler({ x: event.screenX, y: event.screenY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }
  const { listen } = await import('@tauri-apps/api/event');
  return listen<{ x: number; y: number }>('cursor-move', (event) => handler(event.payload));
}

export async function restoreWindow(settings: {
  alwaysOnTop: boolean;
  windowX: number | null;
  windowY: number | null;
}): Promise<void> {
  await setAlwaysOnTop(settings.alwaysOnTop);
  if (settings.windowX != null && settings.windowY != null) {
    await setOuterPosition(settings.windowX, settings.windowY);
  }
}

export async function currentWindowLabel(): Promise<string> {
  if (!isTauri()) return 'main';
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  return getCurrentWindow().label;
}

export async function showSettingsWindow(): Promise<void> {
  if (!isTauri()) return;
  const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
  const existing = await WebviewWindow.getByLabel(SETTINGS_WINDOW_LABEL);
  if (!existing) return;
  await existing.show();
  await existing.unminimize();
  await existing.setFocus();
}

export async function hideSettingsWindow(): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().hide();
}

export async function broadcastSettings(settings: AppSettings): Promise<void> {
  if (!isTauri()) return;
  const { emit } = await import('@tauri-apps/api/event');
  await emit(SETTINGS_CHANGED_EVENT, settings);
}

export async function subscribeSettingsChanged(
  handler: (settings: AppSettings) => void,
): Promise<() => void> {
  if (!isTauri()) return () => undefined;
  const { listen } = await import('@tauri-apps/api/event');
  return listen<AppSettings>(SETTINGS_CHANGED_EVENT, (event) => handler(event.payload));
}
