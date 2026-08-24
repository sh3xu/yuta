import type { ActionName } from '@yuta/shared';
import { PARAM } from '../live2d/mappings';
import { clip, setCh } from './build';
import { CLIPS } from './clips';
import type { MotionClip } from './types';

const weightShift = clip(1680, [
  setCh(PARAM.bodyX, [0, 0], [280, 8, 'easeInOutCubic'], [880, -7], [1680, 0]),
  setCh(PARAM.bodyZ, [0, 0], [300, 6], [900, -5], [1680, 0]),
  setCh(PARAM.angleZ, [0, 0], [260, 10, 'easeInOutCubic'], [860, -8], [1680, 0]),
  setCh(PARAM.armLA, [0, -10], [280, -4], [880, 2], [1680, -10]),
  setCh(PARAM.armRA, [0, -10], [300, 2], [900, -4], [1680, -10]),
  setCh(PARAM.shoulder, [0, 0], [240, 0.35], [1680, 0]),
]);

const glance = clip(1320, [
  setCh(PARAM.eyeBallX, [0, 0], [180, 0.85, 'easeOutCubic'], [720, 0.7], [1320, 0]),
  setCh(PARAM.eyeBallY, [0, 0], [200, -0.2], [720, 0.15], [1320, 0]),
  setCh(PARAM.angleX, [0, 0], [220, 10, 'easeOutCubic'], [720, 8], [1320, 0]),
  setCh(PARAM.angleY, [0, 0], [240, 4], [1320, 0]),
  setCh(PARAM.browLY, [0, 0], [200, 0.4], [1320, 0]),
]);

const breathe = clip(2400, [
  setCh(PARAM.bodyY, [0, 0], [600, -5, 'easeInOutCubic'], [1400, 3], [2400, 0]),
  setCh(PARAM.shoulder, [0, 0], [500, 0.45, 'easeInOutCubic'], [1400, 0.1], [2400, 0]),
  setCh(PARAM.angleY, [0, 0], [700, 5], [2400, 0]),
  setCh(PARAM.armLA, [0, -10], [800, -7], [2400, -10]),
  setCh(PARAM.armRA, [0, -10], [860, -7], [2400, -10]),
]);

const shoulderEase = clip(1560, [
  setCh(PARAM.shoulder, [0, 0], [180, 0.7, 'easeOutCubic'], [720, 0.15], [980, 0.55], [1560, 0]),
  setCh(PARAM.armLA, [0, -10], [200, 4], [780, -8], [1560, -10]),
  setCh(PARAM.armRA, [0, -10], [240, 6], [820, -6], [1560, -10]),
  setCh(PARAM.angleZ, [0, 0], [220, -8], [800, 6], [1560, 0]),
  setCh(PARAM.bodyX, [0, 0], [240, -4], [1560, 0]),
]);

const FROM_ACTIONS: { action: ActionName; weight: number }[] = [
  { action: 'fidget', weight: 3 },
  { action: 'sway', weight: 3 },
  { action: 'headTilt', weight: 3 },
  { action: 'lookLeft', weight: 2 },
  { action: 'lookRight', weight: 2 },
  { action: 'lookUp', weight: 2 },
  { action: 'lookDown', weight: 2 },
  { action: 'think', weight: 2 },
  { action: 'peek', weight: 2 },
  { action: 'nod', weight: 2 },
  { action: 'stretch', weight: 1 },
  { action: 'shrug', weight: 1 },
  { action: 'wink', weight: 1 },
  { action: 'leanIn', weight: 1 },
  { action: 'shy', weight: 1 },
];

export const IDLE_LIBRARY: { clip: MotionClip; weight: number }[] = [
  { clip: weightShift, weight: 3 },
  { clip: glance, weight: 2 },
  { clip: breathe, weight: 3 },
  { clip: shoulderEase, weight: 2 },
  ...FROM_ACTIONS.flatMap(({ action, weight }) => {
    const motion = CLIPS[action];
    return motion ? [{ clip: motion, weight }] : [];
  }),
];

export function selectIdleClip(previous: number | null): { clip: MotionClip; index: number } {
  const weighted: number[] = [];
  IDLE_LIBRARY.forEach((entry, index) => {
    if (index === previous) return;
    for (let i = 0; i < entry.weight; i += 1) weighted.push(index);
  });
  const pool = weighted.length > 0 ? weighted : IDLE_LIBRARY.map((_, index) => index);
  const index = pool[Math.floor(Math.random() * pool.length)] ?? 0;
  const entry = IDLE_LIBRARY[index];
  return { clip: entry.clip, index };
}

export function idleGapMs(): number {
  return 2200 + Math.random() * 5200;
}
