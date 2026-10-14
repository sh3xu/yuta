import { PARAM } from '../live2d/mappings';
import { loopClip, setCh } from './build';
import type { MotionClip } from './types';

const DURATION = 3600;

export const SLOW_WAVE_RATE = 0.5;

export const SLOW_WAVE: MotionClip = loopClip(
  DURATION,
  [
    setCh(PARAM.armRA, [0, -4], [900, 8, 'easeInOutCubic'], [1800, 1], [2700, 8], [DURATION, -4]),
    setCh(PARAM.armLA, [0, -10], [1200, -6], [DURATION, -10]),
    setCh(PARAM.armRB, [0, 1], [800, 7, 'easeInOutCubic'], [1600, 2], [2500, 7], [DURATION, 1]),
    setCh(PARAM.handRB, [0, 0], [900, 6], [1700, 1], [2600, 6], [DURATION, 0]),
    setCh(PARAM.handR, [0, 0], [900, 0.6], [2600, 0.6], [DURATION, 0]),
    setCh(PARAM.shoulder, [0, 0], [800, 0.45], [DURATION, 0]),
    setCh(PARAM.angleZ, [0, 0], [1000, 8, 'easeInOutCubic'], [2000, 3], [DURATION, 0]),
    setCh(PARAM.bodyX, [0, 0], [1000, 5, 'easeInOutCubic'], [DURATION, 0]),
    setCh(PARAM.angleX, [0, 0], [900, 8], [DURATION, 0]),
    setCh(PARAM.eyeLSmile, [0, 0.35], [DURATION, 0.35]),
    setCh(PARAM.eyeRSmile, [0, 0.35], [DURATION, 0.35]),
  ],
  'B',
);
