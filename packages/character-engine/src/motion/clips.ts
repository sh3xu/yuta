import type { ActionName } from '@yuta/shared';
import { PARAM } from '../live2d/mappings';
import type { EaseName } from './easing';
import { ARM_POSE, type Channel, type Keyframe, type MotionClip } from './types';

type Key = [number, number] | [number, number, EaseName];

function keys(...items: Key[]): Keyframe[] {
  return items.map(([t, v, ease]) => (ease ? { t, v, ease } : { t, v }));
}

function setCh(id: string, ...items: Key[]): Channel {
  return { id, keys: keys(...items), mix: 'set' };
}

function clip(duration: number, channels: Channel[], arm: 'A' | 'B' = 'A'): MotionClip {
  if (arm === 'A') return { duration, channels };
  return {
    duration,
    channels: [
      setCh(ARM_POSE, [0, 1], [duration - 160, 1], [duration, 0]),
      ...channels,
    ],
  };
}

function smile(duration: number, peak = 1): Channel[] {
  return [
    setCh(PARAM.eyeLSmile, [0, 0], [140, peak, 'easeOutCubic'], [duration - 200, peak * 0.75], [duration, 0]),
    setCh(PARAM.eyeRSmile, [0, 0], [140, peak, 'easeOutCubic'], [duration - 200, peak * 0.75], [duration, 0]),
    setCh(PARAM.mouthForm, [0, 1], [duration, 1]),
    setCh(PARAM.cheek, [0, 0], [160, peak * 0.85, 'easeOutCubic'], [duration - 180, peak * 0.5], [duration, 0]),
  ];
}

const nod = clip(860, [
  setCh(
    PARAM.angleY,
    [0, 0],
    [70, 8, 'easeInCubic'],
    [220, -28, 'easeOutCubic'],
    [340, 10, 'easeOutBack'],
    [500, -22, 'easeInOutCubic'],
    [640, 6],
    [860, 0, 'easeOutCubic'],
  ),
  setCh(PARAM.bodyY, [0, 0], [220, 10, 'easeOutCubic'], [500, 8], [860, 0]),
  setCh(PARAM.eyeLOpen, [0, 1], [200, 0, 'easeInCubic'], [320, 1, 'easeOutCubic'], [480, 0.15], [580, 1]),
  setCh(PARAM.eyeROpen, [0, 1], [200, 0, 'easeInCubic'], [320, 1, 'easeOutCubic'], [480, 0.15], [580, 1]),
  setCh(PARAM.armLA, [0, -10], [240, -4], [860, -10]),
  setCh(PARAM.armRA, [0, -10], [260, -4], [860, -10]),
]);

const wave = clip(
  1680,
  [
    setCh(PARAM.armRA, [0, -10], [120, 10, 'easeOutBack'], [1480, 10], [1680, -10, 'easeInCubic']),
    setCh(PARAM.armLA, [0, -10], [180, 2], [1480, 0], [1680, -10]),
    setCh(
      PARAM.armRB,
      [0, 0],
      [120, 10, 'easeOutBack'],
      [320, 4],
      [500, 10],
      [680, 4],
      [860, 10],
      [1040, 4],
      [1220, 10],
      [1680, 0, 'easeInCubic'],
    ),
    setCh(PARAM.armLB, [0, 0], [180, 4], [1480, 3], [1680, 0]),
    setCh(
      PARAM.handRB,
      [0, 0],
      [140, 10, 'easeOutCubic'],
      [320, 0],
      [500, 10],
      [680, 0],
      [860, 10],
      [1040, 0],
      [1220, 10],
      [1680, 0],
    ),
    setCh(PARAM.handR, [0, 0], [140, 1], [1220, 1], [1680, 0]),
    setCh(PARAM.shoulder, [0, 0], [140, 1, 'easeOutCubic'], [1480, 0.6], [1680, 0]),
    setCh(PARAM.angleX, [0, 0], [160, 20, 'easeOutCubic'], [1400, 16], [1680, 0]),
    setCh(PARAM.angleZ, [0, 0], [180, 16, 'easeOutCubic'], [1400, 12], [1680, 0]),
    setCh(PARAM.bodyX, [0, 0], [180, 10, 'easeOutCubic'], [1400, 7], [1680, 0]),
    ...smile(1680),
  ],
  'B',
);

const headTilt = clip(1100, [
  setCh(PARAM.angleZ, [0, 0], [80, -4], [280, 28, 'easeOutBack'], [820, 26], [1100, 0, 'easeInOutCubic']),
  setCh(PARAM.bodyZ, [0, 0], [300, -10, 'easeOutCubic'], [820, -8], [1100, 0]),
  setCh(PARAM.angleY, [0, 0], [260, 12], [820, 10], [1100, 0]),
  setCh(PARAM.eyeBallX, [0, 0], [240, 0.85, 'easeOutCubic'], [820, 0.7], [1100, 0]),
  setCh(PARAM.browLY, [0, 0], [240, 1], [1100, 0]),
  setCh(PARAM.browRY, [0, 0], [280, 0.25], [1100, 0]),
  setCh(PARAM.armLA, [0, -10], [300, 4], [1100, -10]),
  setCh(PARAM.armRA, [0, -10], [320, -2], [1100, -10]),
  setCh(PARAM.mouthForm, [0, 1], [260, 0.35], [1100, 1]),
]);

const laugh = clip(1420, [
  setCh(
    PARAM.shoulder,
    [0, 0],
    [80, 1, 'easeOutCubic'],
    [220, 0.1],
    [360, 1],
    [500, 0.1],
    [640, 1],
    [780, 0.15],
    [1420, 0],
  ),
  setCh(
    PARAM.bodyY,
    [0, 0],
    [90, 10, 'easeOutCubic'],
    [230, 1],
    [370, 10],
    [510, 1],
    [650, 9],
    [800, 0],
  ),
  setCh(PARAM.angleY, [0, 0], [90, 16], [230, 0], [370, 18], [510, 0], [650, 14], [1420, 0]),
  setCh(PARAM.angleZ, [0, 0], [140, 14], [420, -12], [720, 12], [1420, 0]),
  setCh(
    PARAM.mouthOpen,
    [0, 0],
    [100, 0.85],
    [240, 0.15],
    [380, 0.8],
    [520, 0.12],
    [660, 0.7],
    [1420, 0],
  ),
  setCh(PARAM.armLA, [0, -10], [120, 8, 'easeOutCubic'], [360, 2], [500, 8], [640, 2], [1200, 4], [1420, -10]),
  setCh(PARAM.armRA, [0, -10], [150, 8, 'easeOutCubic'], [390, 2], [530, 8], [670, 2], [1200, 4], [1420, -10]),
  ...smile(1420),
]);

const jump = clip(980, [
  setCh(PARAM.bodyY, [0, 0], [120, -10, 'easeInCubic'], [280, 10, 'easeOutCubic'], [420, -4], [560, 8], [980, 0]),
  setCh(PARAM.angleY, [0, 0], [120, -20, 'easeInCubic'], [280, 24, 'easeOutCubic'], [420, -6], [560, 12], [980, 0]),
  setCh(PARAM.armLA, [0, -10], [120, -10], [280, 10, 'easeOutBack'], [620, 10], [980, -10]),
  setCh(PARAM.armRA, [0, -10], [140, -10], [300, 10, 'easeOutBack'], [640, 10], [980, -10]),
  setCh(PARAM.shoulder, [0, 0], [120, 0], [280, 1, 'easeOutCubic'], [640, 0.7], [980, 0]),
  setCh(PARAM.bodyZ, [0, 0], [320, 8], [520, -6], [980, 0]),
  setCh(PARAM.angleX, [0, 0], [300, -8], [520, 10], [980, 0]),
  setCh(PARAM.mouthOpen, [0, 0], [280, 0.45], [560, 0.15], [980, 0]),
  ...smile(980, 0.7),
]);

const bow = clip(1320, [
  setCh(PARAM.bodyY, [0, 0], [80, -3], [380, 10, 'easeInOutCubic'], [860, 10], [1320, 0, 'easeOutBack']),
  setCh(PARAM.angleY, [0, 0], [80, 6], [360, -28, 'easeInOutCubic'], [860, -28], [1280, 0, 'easeOutCubic']),
  setCh(PARAM.armLA, [0, -10], [360, 6], [860, 6], [1320, -10]),
  setCh(PARAM.armRA, [0, -10], [380, 6], [860, 6], [1320, -10]),
  setCh(PARAM.shoulder, [0, 0], [340, 0.8], [1320, 0]),
  setCh(PARAM.eyeLOpen, [0, 1], [400, 0.55], [860, 0.55], [1320, 1]),
  setCh(PARAM.eyeROpen, [0, 1], [400, 0.55], [860, 0.55], [1320, 1]),
]);

const shrug = clip(960, [
  setCh(PARAM.shoulder, [0, 0], [80, -0.2], [220, 1, 'easeOutBack'], [640, 1], [960, 0, 'easeInOutCubic']),
  setCh(PARAM.armLA, [0, -10], [220, 10, 'easeOutCubic'], [640, 10], [960, -10]),
  setCh(PARAM.armRA, [0, -10], [240, 10, 'easeOutCubic'], [640, 10], [960, -10]),
  setCh(PARAM.handL, [0, 0], [240, 1], [640, 1], [960, 0]),
  setCh(PARAM.handR, [0, 0], [260, 1], [640, 1], [960, 0]),
  setCh(PARAM.browLY, [0, 0], [180, 1], [960, 0]),
  setCh(PARAM.browRY, [0, 0], [180, 1], [960, 0]),
  setCh(PARAM.angleY, [0, 0], [200, 12], [960, 0]),
  setCh(PARAM.mouthForm, [0, 1], [200, 0], [960, 1]),
]);

const lookLeft = clip(980, [
  setCh(PARAM.angleX, [0, 0], [80, -4], [280, 28, 'easeOutCubic'], [720, 26], [980, 0, 'easeInOutCubic']),
  setCh(PARAM.eyeBallX, [0, 0], [160, 1, 'easeOutCubic'], [720, 0.85], [980, 0]),
  setCh(PARAM.bodyX, [0, 0], [300, 10, 'easeOutCubic'], [720, 8], [980, 0]),
  setCh(PARAM.angleZ, [0, 0], [260, 12], [980, 0]),
  setCh(PARAM.shoulder, [0, 0], [240, 0.5], [980, 0]),
  setCh(PARAM.armLA, [0, -10], [280, 6], [980, -10]),
  setCh(PARAM.armRA, [0, -10], [300, -4], [980, -10]),
  setCh(PARAM.browLY, [0, 0], [240, 0.6], [980, 0]),
]);

const lookRight = clip(980, [
  setCh(PARAM.angleX, [0, 0], [80, 4], [280, -28, 'easeOutCubic'], [720, -26], [980, 0, 'easeInOutCubic']),
  setCh(PARAM.eyeBallX, [0, 0], [160, -1, 'easeOutCubic'], [720, -0.85], [980, 0]),
  setCh(PARAM.bodyX, [0, 0], [300, -10, 'easeOutCubic'], [720, -8], [980, 0]),
  setCh(PARAM.angleZ, [0, 0], [260, -12], [980, 0]),
  setCh(PARAM.shoulder, [0, 0], [240, 0.5], [980, 0]),
  setCh(PARAM.armRA, [0, -10], [280, 6], [980, -10]),
  setCh(PARAM.armLA, [0, -10], [300, -4], [980, -10]),
  setCh(PARAM.browRY, [0, 0], [240, 0.6], [980, 0]),
]);

const lookUp = clip(920, [
  setCh(PARAM.angleY, [0, 0], [70, -6], [260, 28, 'easeOutCubic'], [680, 24], [920, 0]),
  setCh(PARAM.eyeBallY, [0, 0], [180, 1, 'easeOutCubic'], [680, 0.8], [920, 0]),
  setCh(PARAM.bodyY, [0, 0], [240, -10, 'easeOutCubic'], [680, -8], [920, 0]),
  setCh(PARAM.browLY, [0, 0], [200, 1], [920, 0]),
  setCh(PARAM.browRY, [0, 0], [200, 1], [920, 0]),
  setCh(PARAM.mouthOpen, [0, 0], [220, 0.35], [920, 0]),
  setCh(PARAM.shoulder, [0, 0], [220, -0.2], [920, 0]),
  setCh(PARAM.armLA, [0, -10], [240, 2], [920, -10]),
  setCh(PARAM.armRA, [0, -10], [260, 2], [920, -10]),
]);

const lookDown = clip(920, [
  setCh(PARAM.angleY, [0, 0], [70, 6], [260, -28, 'easeOutCubic'], [680, -24], [920, 0]),
  setCh(PARAM.eyeBallY, [0, 0], [180, -1, 'easeOutCubic'], [680, -0.8], [920, 0]),
  setCh(PARAM.bodyY, [0, 0], [240, 10, 'easeOutCubic'], [680, 8], [920, 0]),
  setCh(PARAM.eyeLOpen, [0, 1], [260, 0.55], [680, 0.55], [920, 1]),
  setCh(PARAM.eyeROpen, [0, 1], [260, 0.55], [680, 0.55], [920, 1]),
  setCh(PARAM.shoulder, [0, 0], [240, 0.4], [920, 0]),
  setCh(PARAM.armLA, [0, -10], [260, -4], [920, -10]),
  setCh(PARAM.armRA, [0, -10], [280, -4], [920, -10]),
]);

const think = clip(
  1600,
  [
    setCh(PARAM.angleZ, [0, 0], [280, 22, 'easeOutBack'], [1280, 20], [1600, 0]),
    setCh(PARAM.angleY, [0, 0], [240, 14, 'easeOutCubic'], [1280, 12], [1600, 0]),
    setCh(PARAM.eyeBallY, [0, 0], [200, 0.9, 'easeOutCubic'], [1280, 0.75], [1600, 0]),
    setCh(PARAM.eyeBallX, [0, 0], [240, -0.45], [1600, 0]),
    setCh(PARAM.armRA, [0, -10], [220, 10, 'easeOutCubic'], [1280, 10], [1600, -10]),
    setCh(PARAM.armLA, [0, -10], [260, -4], [1280, -4], [1600, -10]),
    setCh(PARAM.armRB, [0, 0], [200, 10, 'easeOutCubic'], [1280, 10], [1600, 0]),
    setCh(PARAM.armLB, [0, 0], [260, 2], [1280, 2], [1600, 0]),
    setCh(PARAM.handRB, [0, 0], [240, 10, 'easeOutCubic'], [1280, 10], [1600, 0]),
    setCh(PARAM.handR, [0, 0], [240, 1], [1280, 1], [1600, 0]),
    setCh(PARAM.browLY, [0, 0], [220, 1], [1600, 0]),
    setCh(PARAM.browLForm, [0, 0], [220, 0.8], [1600, 0]),
    setCh(PARAM.bodyZ, [0, 0], [300, -8], [1600, 0]),
    setCh(PARAM.eyeLOpen, [0, 1], [500, 0.35], [620, 1], [1000, 0.4], [1120, 1]),
    setCh(PARAM.mouthForm, [0, 1], [280, 0.2], [1600, 1]),
  ],
  'B',
);

const shy = clip(1240, [
  setCh(PARAM.angleY, [0, 0], [80, 4], [280, -20, 'easeOutCubic'], [880, -18], [1240, 0]),
  setCh(PARAM.angleX, [0, 0], [300, 18, 'easeOutCubic'], [880, 14], [1240, 0]),
  setCh(PARAM.angleZ, [0, 0], [280, -14], [1240, 0]),
  setCh(PARAM.cheek, [0, 0], [160, 1, 'easeOutCubic'], [1000, 1], [1240, 0]),
  setCh(PARAM.shoulder, [0, 0], [200, 1], [1240, 0]),
  setCh(PARAM.armLA, [0, -10], [220, 10], [500, 4], [700, 10], [1240, -10]),
  setCh(PARAM.armRA, [0, -10], [260, 8], [560, 10], [780, 6], [1240, -10]),
  setCh(PARAM.eyeBallY, [0, 0], [220, -0.9], [1240, 0]),
  setCh(PARAM.eyeLOpen, [0, 1], [260, 0.4], [880, 0.4], [1240, 1]),
  setCh(PARAM.eyeROpen, [0, 1], [260, 0.4], [880, 0.4], [1240, 1]),
  setCh(PARAM.mouthForm, [0, 1], [240, 0.5], [1240, 1]),
]);

const stretch = clip(
  1840,
  [
    setCh(PARAM.armLA, [0, -10], [220, 10, 'easeOutCubic'], [1500, 10], [1840, -10]),
    setCh(PARAM.armRA, [0, -10], [260, 10, 'easeOutCubic'], [1500, 10], [1840, -10]),
    setCh(PARAM.armLB, [0, 0], [180, 10, 'easeOutCubic'], [1480, 10], [1840, 0]),
    setCh(PARAM.armRB, [0, 0], [240, -8, 'easeOutCubic'], [1480, -8], [1840, 0]),
    setCh(PARAM.handLB, [0, 0], [220, 10, 'easeOutCubic'], [1480, 10], [1840, 0]),
    setCh(PARAM.handRB, [0, 0], [280, 10, 'easeOutCubic'], [1480, 10], [1840, 0]),
    setCh(PARAM.handL, [0, 0], [240, 1], [1480, 1], [1840, 0]),
    setCh(PARAM.handR, [0, 0], [280, 1], [1480, 1], [1840, 0]),
    setCh(PARAM.shoulder, [0, 0], [200, 1, 'easeOutCubic'], [1480, 0.8], [1840, 0]),
    setCh(PARAM.bodyY, [0, 0], [240, -10, 'easeOutCubic'], [1480, -8], [1840, 0]),
    setCh(PARAM.bodyZ, [0, 0], [280, 6], [1840, 0]),
    setCh(PARAM.angleY, [0, 0], [240, 22, 'easeOutCubic'], [1480, 18], [1840, 0]),
    setCh(PARAM.mouthOpen, [0, 0], [360, 0.85, 'easeOutCubic'], [1480, 0.55], [1840, 0]),
    setCh(PARAM.eyeLOpen, [0, 1], [400, 0.15], [1480, 0.2], [1840, 1]),
    setCh(PARAM.eyeROpen, [0, 1], [400, 0.15], [1480, 0.2], [1840, 1]),
  ],
  'B',
);

const celebrate = clip(
  1280,
  [
    setCh(PARAM.armLA, [0, -10], [100, 10, 'easeOutBack'], [280, 4], [440, 10], [600, 4], [1000, 10], [1280, -10]),
    setCh(PARAM.armRA, [0, -10], [120, 10, 'easeOutBack'], [300, 4], [460, 10], [620, 4], [1000, 10], [1280, -10]),
    setCh(PARAM.armLB, [0, 0], [100, 10, 'easeOutBack'], [280, 3], [440, 10], [600, 3], [1000, 10], [1280, 0]),
    setCh(PARAM.armRB, [0, 0], [120, 10, 'easeOutBack'], [300, 3], [460, 10], [620, 3], [1000, 10], [1280, 0]),
    setCh(PARAM.handLB, [0, 0], [120, 10], [280, 2], [440, 10], [600, 2], [1000, 8], [1280, 0]),
    setCh(PARAM.handRB, [0, 0], [140, 10], [300, 2], [460, 10], [620, 2], [1000, 8], [1280, 0]),
    setCh(PARAM.bodyY, [0, 0], [80, 10, 'easeOutCubic'], [220, -2], [360, 10], [500, 0], [640, 8], [1280, 0]),
    setCh(PARAM.angleY, [0, 0], [80, 16], [220, -8], [360, 14], [500, -4], [1280, 0]),
    setCh(PARAM.angleZ, [0, 0], [160, 14], [420, -14], [1280, 0]),
    setCh(PARAM.shoulder, [0, 0], [100, 1], [280, 0.2], [440, 1], [1280, 0]),
    ...smile(1280),
  ],
  'B',
);

const shakeNo = clip(900, [
  setCh(
    PARAM.angleX,
    [0, 0],
    [80, 26, 'easeOutCubic'],
    [200, -24, 'easeInOutCubic'],
    [320, 20, 'easeInOutCubic'],
    [440, -14, 'easeInOutCubic'],
    [560, 8],
    [900, 0, 'easeOutCubic'],
  ),
  setCh(PARAM.bodyX, [0, 0], [80, 10], [200, -10], [320, 8], [440, -6], [900, 0]),
  setCh(PARAM.angleZ, [0, 0], [80, 10], [200, -8], [440, 6], [900, 0]),
  setCh(PARAM.eyeBallX, [0, 0], [80, 0.85], [200, -0.8], [440, 0.3], [900, 0]),
  setCh(PARAM.mouthForm, [0, 1], [120, -0.6], [900, 1]),
  setCh(PARAM.shoulder, [0, 0], [100, 0.7], [900, 0]),
  setCh(PARAM.armLA, [0, -10], [120, 2], [900, -10]),
  setCh(PARAM.armRA, [0, -10], [140, 2], [900, -10]),
]);

const wink = clip(620, [
  setCh(PARAM.eyeLOpen, [0, 1], [70, 0, 'easeInCubic'], [340, 0], [480, 1, 'easeOutCubic'], [620, 1]),
  setCh(PARAM.eyeLSmile, [0, 0], [70, 1], [340, 1], [620, 0]),
  setCh(PARAM.eyeRSmile, [0, 0], [90, 0.7], [340, 0.5], [620, 0]),
  setCh(PARAM.angleZ, [0, 0], [90, 18, 'easeOutBack'], [480, 8], [620, 0]),
  setCh(PARAM.angleX, [0, 0], [100, 12], [620, 0]),
  setCh(PARAM.cheek, [0, 0], [90, 1], [620, 0]),
  setCh(PARAM.mouthForm, [0, 1], [620, 1]),
  setCh(PARAM.armRA, [0, -10], [100, 8], [620, -10]),
  setCh(PARAM.shoulder, [0, 0], [100, 0.5], [620, 0]),
]);

const leanIn = clip(1080, [
  setCh(PARAM.bodyY, [0, 0], [220, 10, 'easeOutCubic'], [780, 10], [1080, 0]),
  setCh(PARAM.angleY, [0, 0], [200, 8, 'easeOutCubic'], [780, 6], [1080, 0]),
  setCh(PARAM.bodyX, [0, 0], [240, 8], [1080, 0]),
  setCh(PARAM.eyeBallY, [0, 0], [220, 0.55], [1080, 0]),
  setCh(PARAM.shoulder, [0, 0], [240, -0.2], [1080, 0]),
  setCh(PARAM.armLA, [0, -10], [260, 8], [1080, -10]),
  setCh(PARAM.armRA, [0, -10], [280, 8], [1080, -10]),
  setCh(PARAM.mouthForm, [0, 1], [240, 0.4], [1080, 1]),
]);

const clap = clip(
  1280,
  [
    setCh(PARAM.armLA, [0, -10], [120, 8, 'easeOutCubic'], [1100, 8], [1280, -10]),
    setCh(PARAM.armRA, [0, -10], [120, 8, 'easeOutCubic'], [1100, 8], [1280, -10]),
    setCh(
      PARAM.armLB,
      [0, 0],
      [120, 8, 'easeOutCubic'],
      [280, 4],
      [420, 9],
      [560, 4],
      [700, 9],
      [840, 4],
      [980, 8],
      [1280, 0],
    ),
    setCh(
      PARAM.armRB,
      [0, 0],
      [120, 8, 'easeOutCubic'],
      [280, 4],
      [420, 9],
      [560, 4],
      [700, 9],
      [840, 4],
      [980, 8],
      [1280, 0],
    ),
    setCh(
      PARAM.handLB,
      [0, 0],
      [140, 10],
      [280, 0],
      [420, 10],
      [560, 0],
      [700, 10],
      [840, 0],
      [980, 10],
      [1280, 0],
    ),
    setCh(
      PARAM.handRB,
      [0, 0],
      [140, 0],
      [280, 10],
      [420, 0],
      [560, 10],
      [700, 0],
      [840, 10],
      [980, 0],
      [1280, 0],
    ),
    setCh(PARAM.bodyY, [0, 0], [140, 8], [280, 1], [420, 8], [560, 1], [700, 8], [840, 1], [1280, 0]),
    setCh(PARAM.angleY, [0, 0], [140, 10], [280, 0], [420, 10], [560, 0], [700, 10], [1280, 0]),
    setCh(PARAM.shoulder, [0, 0], [120, 1], [1100, 0.6], [1280, 0]),
    ...smile(1280, 0.9),
  ],
  'B',
);

const point = clip(
  1200,
  [
    setCh(PARAM.armRA, [0, -10], [140, 10, 'easeOutBack'], [420, 6], [560, 10], [940, 10], [1200, -10]),
    setCh(PARAM.armLA, [0, -10], [180, -2], [940, -2], [1200, -10]),
    setCh(PARAM.armRB, [0, 0], [140, 10, 'easeOutBack'], [420, 5], [560, 10], [940, 10], [1200, 0]),
    setCh(PARAM.armLB, [0, 0], [180, 2], [940, 2], [1200, 0]),
    setCh(PARAM.handRB, [0, 0], [160, 10, 'easeOutCubic'], [420, 4], [560, 10], [940, 10], [1200, 0]),
    setCh(PARAM.handR, [0, 0], [160, 1], [940, 1], [1200, 0]),
    setCh(PARAM.angleX, [0, 0], [180, 22, 'easeOutCubic'], [940, 18], [1200, 0]),
    setCh(PARAM.bodyX, [0, 0], [200, 10, 'easeOutCubic'], [940, 8], [1200, 0]),
    setCh(PARAM.eyeBallX, [0, 0], [160, 0.9], [1200, 0]),
    setCh(PARAM.browLY, [0, 0], [180, 0.8], [1200, 0]),
    setCh(PARAM.mouthForm, [0, 1], [180, 0.3], [1200, 1]),
  ],
  'B',
);

const gasp = clip(900, [
  setCh(PARAM.eyeLOpen, [0, 1], [80, 1.2, 'easeOutCubic'], [620, 1.2], [900, 1]),
  setCh(PARAM.eyeROpen, [0, 1], [80, 1.2, 'easeOutCubic'], [620, 1.2], [900, 1]),
  setCh(PARAM.browLY, [0, 0], [80, 1], [900, 0]),
  setCh(PARAM.browRY, [0, 0], [80, 1], [900, 0]),
  setCh(PARAM.mouthOpen, [0, 0], [90, 1, 'easeOutCubic'], [620, 0.7], [900, 0]),
  setCh(PARAM.mouthForm, [0, 1], [90, 0], [900, 1]),
  setCh(PARAM.bodyY, [0, 0], [100, -10, 'easeOutBack'], [620, -6], [900, 0]),
  setCh(PARAM.angleY, [0, 0], [100, 18, 'easeOutCubic'], [900, 0]),
  setCh(PARAM.shoulder, [0, 0], [80, 1], [900, 0]),
  setCh(PARAM.armLA, [0, -10], [100, 10, 'easeOutBack'], [620, 6], [900, -10]),
  setCh(PARAM.armRA, [0, -10], [120, 10, 'easeOutBack'], [620, 6], [900, -10]),
  setCh(PARAM.handL, [0, 0], [120, 1], [620, 1], [900, 0]),
  setCh(PARAM.handR, [0, 0], [140, 1], [620, 1], [900, 0]),
]);

const sway = clip(1400, [
  setCh(PARAM.bodyX, [0, 0], [180, 10, 'easeInOutCubic'], [500, -10], [820, 10], [1140, -8], [1400, 0]),
  setCh(PARAM.bodyZ, [0, 0], [200, 8], [520, -8], [840, 8], [1400, 0]),
  setCh(PARAM.angleZ, [0, 0], [180, 22, 'easeInOutCubic'], [500, -22], [820, 18], [1400, 0]),
  setCh(PARAM.angleX, [0, 0], [180, 12], [500, -12], [820, 10], [1400, 0]),
  setCh(PARAM.armLA, [0, -10], [180, 10], [500, -6], [820, 10], [1400, -10]),
  setCh(PARAM.armRA, [0, -10], [180, -6], [500, 10], [820, -4], [1400, -10]),
  setCh(PARAM.shoulder, [0, 0], [180, 0.8], [500, 0.2], [820, 0.8], [1400, 0]),
  ...smile(1400, 0.55),
]);

const salute = clip(
  1180,
  [
    setCh(PARAM.armRA, [0, -10], [120, 10, 'easeOutBack'], [860, 10], [1180, -10]),
    setCh(PARAM.armLA, [0, -10], [140, -8], [860, -8], [1180, -10]),
    setCh(PARAM.armRB, [0, 0], [120, 10, 'easeOutBack'], [860, 10], [1180, 0]),
    setCh(PARAM.armLB, [0, 0], [140, 1], [860, 1], [1180, 0]),
    setCh(PARAM.handRB, [0, 0], [140, 10], [860, 10], [1180, 0]),
    setCh(PARAM.handR, [0, 0], [140, 1], [860, 1], [1180, 0]),
    setCh(PARAM.angleY, [0, 0], [140, 8], [860, 6], [1180, 0]),
    setCh(PARAM.bodyY, [0, 0], [160, 8], [1180, 0]),
    setCh(PARAM.eyeLOpen, [0, 1], [180, 0.1], [360, 1], [1180, 1]),
    setCh(PARAM.eyeROpen, [0, 1], [180, 0.1], [360, 1], [1180, 1]),
    setCh(PARAM.shoulder, [0, 0], [140, 0.6], [1180, 0]),
  ],
  'B',
);

const facepalm = clip(
  1560,
  [
    setCh(PARAM.armRA, [0, -10], [160, 10, 'easeOutCubic'], [1280, 10], [1560, -10]),
    setCh(PARAM.armLA, [0, -10], [200, -2], [1280, -2], [1560, -10]),
    setCh(PARAM.armRB, [0, 0], [140, 10, 'easeOutCubic'], [1280, 10], [1560, 0]),
    setCh(PARAM.armLB, [0, 0], [200, 3], [1280, 3], [1560, 0]),
    setCh(PARAM.handRB, [0, 0], [160, 10, 'easeOutCubic'], [1280, 10], [1560, 0]),
    setCh(PARAM.handR, [0, 0], [160, 1], [1280, 1], [1560, 0]),
    setCh(PARAM.angleY, [0, 0], [180, -26, 'easeInOutCubic'], [1280, -24], [1560, 0]),
    setCh(
      PARAM.angleX,
      [0, 0],
      [280, 0],
      [420, 22, 'easeOutCubic'],
      [560, -22, 'easeInOutCubic'],
      [700, 18, 'easeInOutCubic'],
      [840, -16, 'easeInOutCubic'],
      [980, 12],
      [1120, -8],
      [1280, 0],
      [1560, 0],
    ),
    setCh(PARAM.bodyY, [0, 0], [200, 10, 'easeOutCubic'], [1280, 8], [1560, 0]),
    setCh(PARAM.shoulder, [0, 0], [180, 1], [1280, 0.7], [1560, 0]),
    setCh(PARAM.eyeLOpen, [0, 1], [200, 0.12], [1280, 0.15], [1560, 1]),
    setCh(PARAM.eyeROpen, [0, 1], [200, 0.12], [1280, 0.15], [1560, 1]),
    setCh(PARAM.browLY, [0, 0], [180, -1], [1280, -1], [1560, 0]),
    setCh(PARAM.browRY, [0, 0], [180, -1], [1280, -1], [1560, 0]),
    setCh(PARAM.mouthForm, [0, 1], [180, -1], [1280, -0.8], [1560, 1]),
  ],
  'B',
);

const fidget = clip(1200, [
  setCh(PARAM.armLA, [0, -10], [120, 8], [280, -8], [440, 10], [600, -6], [760, 8], [1200, -10]),
  setCh(PARAM.armRA, [0, -10], [140, -8], [300, 10], [460, -8], [620, 8], [780, -4], [1200, -10]),
  setCh(PARAM.shoulder, [0, 0], [120, 1], [380, 0.2], [640, 1], [1200, 0]),
  setCh(PARAM.angleX, [0, 0], [140, 14], [400, -16], [680, 10], [1200, 0]),
  setCh(PARAM.angleZ, [0, 0], [160, -12], [480, 14], [1200, 0]),
  setCh(PARAM.eyeBallX, [0, 0], [140, 0.7], [400, -0.7], [1200, 0]),
  setCh(PARAM.bodyX, [0, 0], [160, 6], [420, -6], [1200, 0]),
]);

const bounce = clip(1000, [
  setCh(PARAM.bodyY, [0, 0], [90, 10, 'easeOutCubic'], [200, -4], [320, 10], [440, -2], [560, 8], [1000, 0]),
  setCh(PARAM.angleY, [0, 0], [90, 12], [200, -6], [320, 12], [440, -4], [1000, 0]),
  setCh(PARAM.armLA, [0, -10], [90, 10], [200, -2], [320, 10], [440, 0], [1000, -10]),
  setCh(PARAM.armRA, [0, -10], [110, 10], [220, -2], [340, 10], [460, 0], [1000, -10]),
  setCh(PARAM.shoulder, [0, 0], [90, 1], [200, 0.2], [320, 1], [1000, 0]),
  ...smile(1000, 0.8),
]);

const peek = clip(1080, [
  setCh(PARAM.angleX, [0, 0], [200, 26, 'easeOutCubic'], [780, 24], [1080, 0]),
  setCh(PARAM.bodyX, [0, 0], [220, 10, 'easeOutCubic'], [780, 8], [1080, 0]),
  setCh(PARAM.angleZ, [0, 0], [200, 18, 'easeOutBack'], [780, 14], [1080, 0]),
  setCh(PARAM.eyeBallX, [0, 0], [180, 1], [1080, 0]),
  setCh(PARAM.browLY, [0, 0], [200, 1], [1080, 0]),
  setCh(PARAM.armLA, [0, -10], [220, 10], [1080, -10]),
  setCh(PARAM.armRA, [0, -10], [260, -4], [1080, -10]),
  setCh(PARAM.mouthForm, [0, 1], [220, 0.2], [1080, 1]),
  setCh(PARAM.shoulder, [0, 0], [220, 0.6], [1080, 0]),
]);

const sleep = clip(1600, [
  setCh(PARAM.eyeLOpen, [0, 1], [280, 0, 'easeInCubic'], [1280, 0], [1600, 1, 'easeOutCubic']),
  setCh(PARAM.eyeROpen, [0, 1], [300, 0, 'easeInCubic'], [1280, 0], [1600, 1, 'easeOutCubic']),
  setCh(PARAM.angleY, [0, 0], [320, -24, 'easeInOutCubic'], [1280, -22], [1600, 0]),
  setCh(PARAM.angleZ, [0, 0], [340, 18], [1600, 0]),
  setCh(PARAM.bodyY, [0, 0], [340, 10], [1600, 0]),
  setCh(PARAM.mouthOpen, [0, 0], [480, 0.45], [760, 0.08], [1040, 0.5], [1320, 0.1], [1600, 0]),
  setCh(PARAM.armLA, [0, -10], [360, 2], [1600, -10]),
  setCh(PARAM.armRA, [0, -10], [380, 2], [1600, -10]),
  setCh(PARAM.shoulder, [0, 0], [360, -0.2], [1600, 0]),
]);

const blowKiss = clip(
  1180,
  [
    setCh(PARAM.armRA, [0, -10], [140, 10, 'easeOutCubic'], [480, 10], [720, 4], [1180, -10]),
    setCh(PARAM.armLA, [0, -10], [180, 2], [1180, -10]),
    setCh(PARAM.armRB, [0, 0], [140, 10, 'easeOutCubic'], [480, 10], [720, 3], [1180, 0]),
    setCh(PARAM.handRB, [0, 0], [160, 10], [480, 10], [720, 2], [1180, 0]),
    setCh(PARAM.mouthForm, [0, 1], [180, 0.15], [400, 1], [1180, 1]),
    setCh(PARAM.mouthOpen, [0, 0], [200, 0.12], [380, 0.65], [540, 0], [1180, 0]),
    setCh(PARAM.cheek, [0, 0], [160, 1], [900, 0.8], [1180, 0]),
    setCh(PARAM.angleZ, [0, 0], [180, 14, 'easeOutBack'], [1180, 0]),
    setCh(PARAM.angleY, [0, 0], [200, 8], [480, 12], [720, 0], [1180, 0]),
    setCh(PARAM.bodyY, [0, 0], [220, 6], [540, 8], [1180, 0]),
    setCh(PARAM.eyeLSmile, [0, 0], [160, 1], [1180, 0]),
    setCh(PARAM.eyeRSmile, [0, 0], [160, 1], [1180, 0]),
  ],
  'B',
);

const dance = clip(1560, [
  setCh(PARAM.bodyX, [0, 0], [140, 10], [360, -10], [580, 10], [800, -10], [1020, 10], [1560, 0]),
  setCh(PARAM.bodyY, [0, 0], [140, 10], [360, 0], [580, 10], [800, 0], [1020, 10], [1560, 0]),
  setCh(PARAM.angleZ, [0, 0], [140, 22], [360, -22], [580, 22], [800, -18], [1560, 0]),
  setCh(PARAM.angleY, [0, 0], [140, 10], [360, -6], [580, 10], [800, -4], [1560, 0]),
  setCh(PARAM.armLA, [0, -10], [140, 10], [360, -8], [580, 10], [800, -6], [1020, 10], [1560, -10]),
  setCh(PARAM.armRA, [0, -10], [140, -8], [360, 10], [580, -6], [800, 10], [1020, -2], [1560, -10]),
  setCh(PARAM.handL, [0, 0], [140, 1], [360, 0], [580, 1], [1560, 0]),
  setCh(PARAM.handR, [0, 0], [140, 0], [360, 1], [580, 0], [800, 1], [1560, 0]),
  setCh(PARAM.shoulder, [0, 0], [140, 1], [360, 0.2], [580, 1], [1560, 0]),
  ...smile(1560),
]);

export const CLIPS: Record<ActionName, MotionClip | null> = {
  idle: null,
  nod,
  wave,
  headTilt,
  laugh,
  jump,
  bow,
  shrug,
  lookLeft,
  lookRight,
  lookUp,
  lookDown,
  think,
  shy,
  stretch,
  celebrate,
  shakeNo,
  wink,
  leanIn,
  clap,
  point,
  gasp,
  sway,
  salute,
  facepalm,
  fidget,
  bounce,
  peek,
  sleep,
  blowKiss,
  dance,
};
