import type { AppSettings } from './settings';
import type { StickerMode } from './sticker';
import { stickerSize } from './sticker';
import { isTauri } from './tauri-fs';

export const UNLOCK_POSITION_EVENT = 'unlock-position';

export async function setStickerSize(mode: StickerMode, settings: AppSettings): Promise<void> {
  if (!isTauri()) return;
  const { LogicalSize } = await import('@tauri-apps/api/dpi');
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const size = stickerSize(mode, settings);
  await getCurrentWindow().setSize(new LogicalSize(size.width, size.height));
}

export async function setAlwaysOnTop(value: boolean): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().setAlwaysOnTop(value);
}

export async function getOuterPosition(): Promise<{ x: number; y: number } | null> {
  if (!isTauri()) return null;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  const position = await getCurrentWindow().outerPosition();
  return { x: position.x, y: position.y };
}

export async function getScaleFactor(): Promise<number> {
  if (!isTauri()) return window.devicePixelRatio || 1;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  return getCurrentWindow().scaleFactor();
}

export async function setOuterPosition(x: number, y: number): Promise<void> {
  if (!isTauri()) return;
  const { PhysicalPosition } = await import('@tauri-apps/api/dpi');
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().setPosition(new PhysicalPosition(x, y));
}

export async function startWindowDrag(): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().startDragging();
}

export async function closeWindow(): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  await getCurrentWindow().close();
}

export async function subscribeUnlockPosition(handler: () => void): Promise<() => void> {
  if (!isTauri()) return () => undefined;
  const { listen } = await import('@tauri-apps/api/event');
  return listen(UNLOCK_POSITION_EVENT, handler);
}

export async function subscribeCursorMove(
  handler: (point: { x: number; y: number }) => void,
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
