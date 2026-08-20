import type { AppSettings, InputCorner } from './settings';

export const BASE_STAGE_WIDTH = 280;
export const BASE_STAGE_HEIGHT = 520;
export const WINDOW_PAD = 8;
export const BUBBLE_MS = 4500;
export const CURSOR_MOVE_EVENT = 'cursor-move';
export const SETTINGS_CHANGED_EVENT = 'settings-changed';

export type StickerMode = 'collapsed' | 'place' | 'linger' | 'chat' | 'settings' | 'onboarding';

export interface VisibleStage {
  width: number;
  height: number;
  layoutWidth: number;
  layoutHeight: number;
  cropLeftPx: number;
  cropTopPx: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function layoutSize(settings: Pick<AppSettings, 'modelScale'>): {
  width: number;
  height: number;
} {
  const scale = clamp(settings.modelScale, 0.5, 2);
  return {
    width: Math.round(BASE_STAGE_WIDTH * scale),
    height: Math.round(BASE_STAGE_HEIGHT * scale),
  };
}

export function visibleStage(settings: AppSettings): VisibleStage {
  const layout = layoutSize(settings);
  const cropLeft = clamp(settings.cropLeft, 0, 0.45);
  const cropRight = clamp(settings.cropRight, 0, 0.45);
  const cropTop = clamp(settings.cropTop, 0, 0.45);
  const cropBottom = clamp(settings.cropBottom, 0, 0.7);
  const cropLeftPx = Math.round(layout.width * cropLeft);
  const cropTopPx = Math.round(layout.height * cropTop);
  return {
    layoutWidth: layout.width,
    layoutHeight: layout.height,
    cropLeftPx,
    cropTopPx,
    width: Math.max(120, layout.width - cropLeftPx - Math.round(layout.width * cropRight)),
    height: Math.max(140, layout.height - cropTopPx - Math.round(layout.height * cropBottom)),
  };
}

export function isInputLeft(corner: InputCorner): boolean {
  return corner.startsWith('left');
}

export function isInputTop(corner: InputCorner): boolean {
  return corner.endsWith('top');
}

export function characterInsetX(mode: StickerMode, settings: AppSettings): number {
  const dockOpen = mode !== 'collapsed' && mode !== 'place';
  if (!dockOpen || !isInputLeft(settings.inputCorner)) return WINDOW_PAD;
  return Math.max(WINDOW_PAD, WINDOW_PAD + settings.dockWidth + settings.dockGap);
}

export function dockInsetX(mode: StickerMode, settings: AppSettings): number {
  const dockOpen = mode !== 'collapsed' && mode !== 'place';
  if (!dockOpen || isInputLeft(settings.inputCorner)) return WINDOW_PAD;
  return WINDOW_PAD + visibleStage(settings).width + settings.dockGap;
}

export function stickerSize(
  mode: StickerMode,
  settings: AppSettings,
): { width: number; height: number } {
  const stage = visibleStage(settings);
  const dockOpen = mode !== 'collapsed' && mode !== 'place';
  const dock = dockOpen ? settings.dockWidth + settings.dockGap : 0;
  const width = Math.max(stage.width + WINDOW_PAD * 2, stage.width + dock + WINDOW_PAD * 2);
  let height = stage.height + WINDOW_PAD * 2;
  if (mode === 'onboarding') {
    height = Math.max(height, 420 + WINDOW_PAD * 2);
  }
  return { width, height };
}

export function stickerMode(input: {
  onboardingComplete: boolean;
  positionLocked: boolean;
  composerOpen: boolean;
  bubbleVisible: boolean;
  sending?: boolean;
}): StickerMode {
  if (!input.onboardingComplete) return 'onboarding';
  if (input.composerOpen) return 'chat';
  if (input.bubbleVisible || input.sending) return 'linger';
  if (!input.positionLocked) return 'place';
  return 'collapsed';
}

export function uiScale(modelScale: number): number {
  return clamp(modelScale, 0.75, 1.4);
}
