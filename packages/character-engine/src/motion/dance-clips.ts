import type { DanceMoveName } from '@yuta/shared';
import { PARAM } from '../live2d/mappings';
import { loopClip, pulseCh, setCh, smile, waveCh } from './build';
import type { MotionClip } from './types';

export type DanceEnergy = 'low' | 'mid' | 'high';
export type DanceAccent = 'bass' | 'mid' | 'treble' | 'full';

export interface DanceMoveDef {
  name: DanceMoveName;
  energy: DanceEnergy;
  accent: DanceAccent;
  beats: 2 | 4;
  clip: MotionClip;
}

const LOW = 800;
const MID = 1000;
const HIGH = 640;

function happyFace(duration: number, peak = 0.85) {
  return smile(duration, peak);
}

const swayGroove = loopClip(LOW, [
  waveCh(PARAM.bodyX, LOW, 2, 10),
  waveCh(PARAM.angleZ, LOW, 2, 16),
  waveCh(PARAM.bodyY, LOW, 2, 5),
  waveCh(PARAM.armLA, LOW, 2, 6, -10),
  waveCh(PARAM.armRA, LOW, 2, 6, -10),
  pulseCh(PARAM.shoulder, LOW, 4, 0.45),
  ...happyFace(LOW, 0.55),
]);

const headBob = loopClip(HIGH, [
  pulseCh(PARAM.angleY, HIGH, 2, -16),
  pulseCh(PARAM.bodyY, HIGH, 2, 7),
  waveCh(PARAM.angleZ, HIGH, 2, 8),
  setCh(PARAM.eyeLOpen, [0, 1], [140, 0.35, 'easeInCubic'], [260, 1], [460, 0.4], [HIGH, 1]),
  setCh(PARAM.eyeROpen, [0, 1], [140, 0.35, 'easeInCubic'], [260, 1], [460, 0.4], [HIGH, 1]),
  waveCh(PARAM.armLA, HIGH, 2, 4, -10),
  waveCh(PARAM.armRA, HIGH, 2, 4, -10),
  ...happyFace(HIGH, 0.5),
]);

const hipSway = loopClip(LOW, [
  waveCh(PARAM.bodyX, LOW, 2, 12),
  waveCh(PARAM.bodyZ, LOW, 2, 8),
  pulseCh(PARAM.bodyY, LOW, 4, 8),
  waveCh(PARAM.angleZ, LOW, 2, 14),
  waveCh(PARAM.leg, LOW, 2, 0.25, 1),
  waveCh(PARAM.armLA, LOW, 2, 5, -8),
  waveCh(PARAM.armRA, LOW, 2, 5, -8),
  ...happyFace(LOW, 0.6),
]);

const stepTouch = loopClip(LOW, [
  waveCh(PARAM.bodyX, LOW, 2, 8),
  pulseCh(PARAM.leg, LOW, 4, 0.2, 1),
  pulseCh(PARAM.bodyY, LOW, 4, 6),
  waveCh(PARAM.angleX, LOW, 2, 10),
  waveCh(PARAM.armLA, LOW, 2, 7, -10),
  waveCh(PARAM.armRA, LOW, 2, -7, -10),
  pulseCh(PARAM.shoulder, LOW, 4, 0.4),
  ...happyFace(LOW, 0.5),
]);

const shoulderRoll = loopClip(LOW, [
  pulseCh(PARAM.shoulder, LOW, 4, 0.95),
  waveCh(PARAM.angleZ, LOW, 2, 10),
  waveCh(PARAM.bodyZ, LOW, 2, 6),
  setCh(PARAM.armLA, [0, -6], [200, 4], [400, -8], [600, 4], [LOW, -6]),
  setCh(PARAM.armRA, [0, -6], [200, -8], [400, 4], [600, -8], [LOW, -6]),
  ...happyFace(LOW, 0.45),
]);

const leanGroove = loopClip(LOW, [
  setCh(PARAM.bodyY, [0, 0], [200, 8, 'easeOutCubic'], [600, 10], [LOW, 0]),
  waveCh(PARAM.angleY, LOW, 1, 10),
  waveCh(PARAM.bodyX, LOW, 1, 6),
  waveCh(PARAM.angleZ, LOW, 2, 8),
  setCh(PARAM.armLA, [0, -10], [220, 2], [LOW, -10]),
  setCh(PARAM.armRA, [0, -10], [240, 6], [LOW, -10]),
  ...happyFace(LOW, 0.4),
]);

const lookSweep = loopClip(LOW, [
  waveCh(PARAM.angleX, LOW, 1, 22),
  waveCh(PARAM.eyeBallX, LOW, 1, 0.85),
  waveCh(PARAM.bodyX, LOW, 1, 8),
  waveCh(PARAM.angleZ, LOW, 1, 10),
  pulseCh(PARAM.bodyY, LOW, 2, 4),
  waveCh(PARAM.armLA, LOW, 2, 4, -10),
  waveCh(PARAM.armRA, LOW, 2, 4, -10),
  ...happyFace(LOW, 0.4),
]);

const bounceGroove = loopClip(MID, [
  pulseCh(PARAM.bodyY, MID, 4, 12),
  pulseCh(PARAM.leg, MID, 4, 0.28, 1),
  pulseCh(PARAM.shoulder, MID, 4, 0.7),
  waveCh(PARAM.angleZ, MID, 2, 10),
  waveCh(PARAM.armLA, MID, 4, 8, -8),
  waveCh(PARAM.armRA, MID, 4, 8, -8),
  ...happyFace(MID, 0.7),
]);

const sideStep = loopClip(LOW, [
  waveCh(PARAM.bodyX, LOW, 2, 14),
  pulseCh(PARAM.bodyY, LOW, 4, 7),
  waveCh(PARAM.angleZ, LOW, 2, 18),
  waveCh(PARAM.leg, LOW, 2, 0.22, 1),
  setCh(PARAM.armLA, [0, -10], [200, 8], [400, -6], [600, 8], [LOW, -10]),
  setCh(PARAM.armRA, [0, -10], [200, -6], [400, 8], [600, -6], [LOW, -10]),
  ...happyFace(LOW, 0.65),
]);

const armPump = loopClip(
  HIGH,
  [
    setCh(PARAM.armLA, [0, -4], [160, 10, 'easeOutCubic'], [320, -2], [480, 10], [HIGH, -4]),
    setCh(PARAM.armRA, [0, 8], [160, -4], [320, 10, 'easeOutCubic'], [480, -4], [HIGH, 8]),
    setCh(PARAM.armLB, [0, 2], [160, 10], [320, 1], [480, 10], [HIGH, 2]),
    setCh(PARAM.armRB, [0, 8], [160, 1], [320, 10], [480, 1], [HIGH, 8]),
    setCh(PARAM.handL, [0, 1], [HIGH, 1]),
    setCh(PARAM.handR, [0, 1], [HIGH, 1]),
    pulseCh(PARAM.bodyY, HIGH, 2, 8),
    pulseCh(PARAM.shoulder, HIGH, 2, 0.85),
    waveCh(PARAM.angleZ, HIGH, 2, 12),
    ...happyFace(HIGH, 0.75),
  ],
  'B',
);

const twist = loopClip(LOW, [
  waveCh(PARAM.bodyZ, LOW, 2, 12),
  waveCh(PARAM.angleX, LOW, 2, 18),
  waveCh(PARAM.angleZ, LOW, 2, 16),
  waveCh(PARAM.bodyX, LOW, 2, 6),
  waveCh(PARAM.armLA, LOW, 2, 8, -6),
  waveCh(PARAM.armRA, LOW, 2, -8, -6),
  pulseCh(PARAM.bodyY, LOW, 4, 5),
  ...happyFace(LOW, 0.55),
]);

const clapStep = loopClip(
  LOW,
  [
    setCh(PARAM.armLA, [0, -4], [180, 10, 'easeOutCubic'], [280, 6], [400, 10], [LOW, -4]),
    setCh(PARAM.armRA, [0, -4], [180, 10, 'easeOutCubic'], [280, 6], [400, 10], [LOW, -4]),
    setCh(PARAM.armLB, [0, 2], [160, 10], [280, 4], [400, 10], [LOW, 2]),
    setCh(PARAM.armRB, [0, 2], [160, 10], [280, 4], [400, 10], [LOW, 2]),
    setCh(PARAM.handLB, [0, 0], [160, 10], [280, 4], [400, 10], [LOW, 0]),
    setCh(PARAM.handRB, [0, 0], [160, 10], [280, 4], [400, 10], [LOW, 0]),
    pulseCh(PARAM.bodyY, LOW, 4, 6),
    pulseCh(PARAM.shoulder, LOW, 4, 0.7),
    waveCh(PARAM.angleZ, LOW, 2, 8),
    ...happyFace(LOW, 0.8),
  ],
  'B',
);

const waveArms = loopClip(
  LOW,
  [
    setCh(PARAM.armRA, [0, 6], [160, 10], [320, 4], [480, 10], [640, 4], [LOW, 6]),
    setCh(PARAM.armLA, [0, 4], [180, 10], [340, 2], [500, 10], [LOW, 4]),
    setCh(PARAM.armRB, [0, 6], [140, 10], [300, 3], [460, 10], [620, 3], [LOW, 6]),
    setCh(PARAM.handRB, [0, 4], [140, 10], [300, 0], [460, 10], [LOW, 4]),
    waveCh(PARAM.angleZ, LOW, 2, 14),
    waveCh(PARAM.bodyX, LOW, 2, 8),
    pulseCh(PARAM.bodyY, LOW, 4, 5),
    ...happyFace(LOW, 0.85),
  ],
  'B',
);

const shuffle = loopClip(LOW, [
  waveCh(PARAM.bodyX, LOW, 4, 8),
  waveCh(PARAM.angleZ, LOW, 4, 12),
  pulseCh(PARAM.leg, LOW, 8, 0.18, 1),
  pulseCh(PARAM.bodyY, LOW, 8, 4),
  waveCh(PARAM.armLA, LOW, 4, 5, -8),
  waveCh(PARAM.armRA, LOW, 4, 5, -8),
  pulseCh(PARAM.shoulder, LOW, 8, 0.35),
  ...happyFace(LOW, 0.6),
]);

const bodyRoll = loopClip(LOW, [
  setCh(PARAM.bodyY, [0, 0], [160, 10, 'easeOutCubic'], [320, -4], [480, 8], [640, 0], [LOW, 0]),
  setCh(PARAM.bodyZ, [0, 0], [180, 10], [360, -8], [540, 6], [LOW, 0]),
  setCh(PARAM.angleY, [0, 0], [200, 12], [400, -8], [LOW, 0]),
  waveCh(PARAM.angleZ, LOW, 2, 10),
  waveCh(PARAM.armLA, LOW, 2, 6, -8),
  waveCh(PARAM.armRA, LOW, 2, 6, -8),
  pulseCh(PARAM.shoulder, LOW, 4, 0.55),
  ...happyFace(LOW, 0.55),
]);

const pointGroove = loopClip(
  HIGH,
  [
    setCh(PARAM.armRA, [0, -10], [120, 10, 'easeOutBack'], [480, 10], [HIGH, -10]),
    setCh(PARAM.armRB, [0, 0], [120, 10, 'easeOutBack'], [480, 10], [HIGH, 0]),
    setCh(PARAM.handRB, [0, 0], [140, 10], [480, 8], [HIGH, 0]),
    setCh(PARAM.armLA, [0, -10], [180, 2], [HIGH, -10]),
    waveCh(PARAM.angleX, HIGH, 1, 16),
    pulseCh(PARAM.bodyY, HIGH, 2, 6),
    waveCh(PARAM.angleZ, HIGH, 2, 10),
    ...happyFace(HIGH, 0.7),
  ],
  'B',
);

const shimmy = loopClip(HIGH, [
  setCh(
    PARAM.shoulder,
    [0, 0.2],
    [80, 1],
    [160, 0.1],
    [240, 1],
    [320, 0.1],
    [400, 1],
    [480, 0.1],
    [HIGH, 0.2],
  ),
  waveCh(PARAM.bodyX, HIGH, 4, 5),
  waveCh(PARAM.angleZ, HIGH, 4, 8),
  setCh(PARAM.armLA, [0, -4], [HIGH, -4]),
  setCh(PARAM.armRA, [0, -4], [HIGH, -4]),
  ...happyFace(HIGH, 0.7),
]);

const wiggle = loopClip(HIGH, [
  waveCh(PARAM.bodyX, HIGH, 4, 10),
  waveCh(PARAM.angleZ, HIGH, 4, 18),
  waveCh(PARAM.bodyZ, HIGH, 4, 6),
  waveCh(PARAM.armLA, HIGH, 4, 8, -6),
  waveCh(PARAM.armRA, HIGH, 4, -8, -6),
  pulseCh(PARAM.bodyY, HIGH, 4, 5),
  ...happyFace(HIGH, 0.75),
]);

const kickStep = loopClip(HIGH, [
  setCh(PARAM.leg, [0, 1], [120, 0.35, 'easeOutCubic'], [280, 1], [440, 0.4], [HIGH, 1]),
  pulseCh(PARAM.bodyY, HIGH, 2, 10),
  waveCh(PARAM.bodyX, HIGH, 2, 10),
  waveCh(PARAM.angleZ, HIGH, 2, 16),
  setCh(PARAM.armLA, [0, -10], [140, 8, 'easeOutBack'], [HIGH, -10]),
  setCh(PARAM.armRA, [0, -4], [160, -10], [HIGH, -4]),
  ...happyFace(HIGH, 0.7),
]);

const jumpGroove = loopClip(HIGH, [
  setCh(
    PARAM.bodyY,
    [0, 0],
    [80, -8, 'easeInCubic'],
    [220, 16, 'easeOutCubic'],
    [400, 2],
    [HIGH, 0],
  ),
  setCh(PARAM.leg, [0, 1], [90, 0.2], [230, 1], [HIGH, 1]),
  setCh(PARAM.armLA, [0, -10], [200, 10, 'easeOutBack'], [HIGH, -10]),
  setCh(PARAM.armRA, [0, -10], [210, 10, 'easeOutBack'], [HIGH, -10]),
  pulseCh(PARAM.shoulder, HIGH, 2, 0.8),
  setCh(PARAM.angleY, [0, 0], [200, 8], [HIGH, 0]),
  ...happyFace(HIGH, 0.9),
]);

const fistPump = loopClip(
  HIGH,
  [
    setCh(PARAM.armRA, [0, -2], [140, 10, 'easeOutBack'], [300, 2], [460, 10], [HIGH, -2]),
    setCh(PARAM.armRB, [0, 2], [140, 10], [300, 2], [460, 10], [HIGH, 2]),
    setCh(PARAM.handR, [0, 1], [HIGH, 1]),
    setCh(PARAM.armLA, [0, -8], [180, 2], [HIGH, -8]),
    pulseCh(PARAM.bodyY, HIGH, 2, 10),
    waveCh(PARAM.angleZ, HIGH, 2, 14),
    pulseCh(PARAM.shoulder, HIGH, 2, 0.9),
    ...happyFace(HIGH, 0.85),
  ],
  'B',
);

const spinTwist = loopClip(LOW, [
  waveCh(PARAM.angleX, LOW, 1, 28),
  waveCh(PARAM.bodyZ, LOW, 1, 12),
  waveCh(PARAM.angleZ, LOW, 2, 20),
  pulseCh(PARAM.bodyY, LOW, 4, 8),
  setCh(PARAM.armLA, [0, -10], [180, 10, 'easeOutCubic'], [400, -4], [600, 10], [LOW, -10]),
  setCh(PARAM.armRA, [0, -10], [200, -4], [420, 10], [620, -4], [LOW, -10]),
  ...happyFace(LOW, 0.8),
]);

const stomp = loopClip(HIGH, [
  setCh(PARAM.bodyY, [0, 0], [80, 12, 'easeOutCubic'], [180, -6], [320, 12], [440, -4], [HIGH, 0]),
  pulseCh(PARAM.leg, HIGH, 2, 0.4, 1),
  pulseCh(PARAM.shoulder, HIGH, 2, 1),
  waveCh(PARAM.angleZ, HIGH, 2, 12),
  setCh(PARAM.armLA, [0, -6], [140, 8], [HIGH, -6]),
  setCh(PARAM.armRA, [0, -6], [160, 8], [HIGH, -6]),
  ...happyFace(HIGH, 0.7),
]);

const doubleBounce = loopClip(HIGH, [
  pulseCh(PARAM.bodyY, HIGH, 4, 12),
  pulseCh(PARAM.leg, HIGH, 4, 0.3, 1),
  waveCh(PARAM.armLA, HIGH, 4, 9, -8),
  waveCh(PARAM.armRA, HIGH, 4, 9, -8),
  pulseCh(PARAM.shoulder, HIGH, 4, 0.75),
  waveCh(PARAM.angleZ, HIGH, 4, 10),
  ...happyFace(HIGH, 0.85),
]);

const armSwing = loopClip(LOW, [
  waveCh(PARAM.armLA, LOW, 2, 12, -6),
  waveCh(PARAM.armRA, LOW, 2, -12, -6),
  waveCh(PARAM.bodyX, LOW, 2, 10),
  waveCh(PARAM.angleZ, LOW, 2, 16),
  pulseCh(PARAM.bodyY, LOW, 4, 7),
  pulseCh(PARAM.shoulder, LOW, 4, 0.6),
  setCh(PARAM.handL, [0, 1], [LOW, 1]),
  setCh(PARAM.handR, [0, 1], [LOW, 1]),
  ...happyFace(LOW, 0.75),
]);

const dropBounce = loopClip(LOW, [
  setCh(
    PARAM.bodyY,
    [0, 0],
    [180, -10, 'easeInCubic'],
    [320, 14, 'easeOutBack'],
    [520, 2],
    [LOW, 0],
  ),
  setCh(PARAM.leg, [0, 1], [180, 0.15], [340, 1], [LOW, 1]),
  setCh(PARAM.armLA, [0, -10], [200, 10, 'easeOutBack'], [LOW, -10]),
  setCh(PARAM.armRA, [0, -10], [220, 10, 'easeOutBack'], [LOW, -10]),
  waveCh(PARAM.angleZ, LOW, 2, 12),
  pulseCh(PARAM.shoulder, LOW, 2, 0.85),
  ...happyFace(LOW, 0.8),
]);

const celebrateGroove = loopClip(
  LOW,
  [
    setCh(PARAM.armLA, [0, 2], [160, 10, 'easeOutBack'], [400, 6], [560, 10], [LOW, 2]),
    setCh(PARAM.armRA, [0, 2], [180, 10, 'easeOutBack'], [420, 6], [580, 10], [LOW, 2]),
    setCh(PARAM.armLB, [0, 4], [160, 10], [LOW, 4]),
    setCh(PARAM.armRB, [0, 4], [180, 10], [LOW, 4]),
    pulseCh(PARAM.bodyY, LOW, 4, 10),
    waveCh(PARAM.angleZ, LOW, 2, 14),
    pulseCh(PARAM.shoulder, LOW, 4, 0.8),
    ...happyFace(LOW, 1),
  ],
  'B',
);

const hopSide = loopClip(HIGH, [
  waveCh(PARAM.bodyX, HIGH, 2, 12),
  setCh(PARAM.bodyY, [0, 0], [100, 12, 'easeOutCubic'], [220, 0], [420, 12], [HIGH, 0]),
  pulseCh(PARAM.leg, HIGH, 2, 0.25, 1),
  setCh(PARAM.armLA, [0, -10], [120, 10], [HIGH, -10]),
  setCh(PARAM.armRA, [0, -10], [140, 8], [HIGH, -10]),
  waveCh(PARAM.angleZ, HIGH, 2, 16),
  ...happyFace(HIGH, 0.8),
]);

export const DANCE_LIBRARY: Record<DanceMoveName, DanceMoveDef> = {
  swayGroove: { name: 'swayGroove', energy: 'low', accent: 'full', beats: 4, clip: swayGroove },
  headBob: { name: 'headBob', energy: 'low', accent: 'bass', beats: 2, clip: headBob },
  hipSway: { name: 'hipSway', energy: 'low', accent: 'bass', beats: 4, clip: hipSway },
  stepTouch: { name: 'stepTouch', energy: 'low', accent: 'full', beats: 4, clip: stepTouch },
  shoulderRoll: {
    name: 'shoulderRoll',
    energy: 'low',
    accent: 'mid',
    beats: 4,
    clip: shoulderRoll,
  },
  leanGroove: { name: 'leanGroove', energy: 'low', accent: 'bass', beats: 4, clip: leanGroove },
  lookSweep: { name: 'lookSweep', energy: 'low', accent: 'mid', beats: 4, clip: lookSweep },
  bounceGroove: {
    name: 'bounceGroove',
    energy: 'mid',
    accent: 'bass',
    beats: 2,
    clip: bounceGroove,
  },
  sideStep: { name: 'sideStep', energy: 'mid', accent: 'bass', beats: 4, clip: sideStep },
  armPump: { name: 'armPump', energy: 'mid', accent: 'bass', beats: 2, clip: armPump },
  twist: { name: 'twist', energy: 'mid', accent: 'mid', beats: 4, clip: twist },
  clapStep: { name: 'clapStep', energy: 'mid', accent: 'treble', beats: 4, clip: clapStep },
  waveArms: { name: 'waveArms', energy: 'mid', accent: 'treble', beats: 4, clip: waveArms },
  shuffle: { name: 'shuffle', energy: 'mid', accent: 'full', beats: 4, clip: shuffle },
  bodyRoll: { name: 'bodyRoll', energy: 'mid', accent: 'bass', beats: 4, clip: bodyRoll },
  pointGroove: {
    name: 'pointGroove',
    energy: 'mid',
    accent: 'treble',
    beats: 2,
    clip: pointGroove,
  },
  shimmy: { name: 'shimmy', energy: 'mid', accent: 'treble', beats: 2, clip: shimmy },
  wiggle: { name: 'wiggle', energy: 'mid', accent: 'full', beats: 2, clip: wiggle },
  kickStep: { name: 'kickStep', energy: 'high', accent: 'bass', beats: 2, clip: kickStep },
  jumpGroove: { name: 'jumpGroove', energy: 'high', accent: 'bass', beats: 2, clip: jumpGroove },
  fistPump: { name: 'fistPump', energy: 'high', accent: 'bass', beats: 2, clip: fistPump },
  spinTwist: { name: 'spinTwist', energy: 'high', accent: 'mid', beats: 4, clip: spinTwist },
  stomp: { name: 'stomp', energy: 'high', accent: 'bass', beats: 2, clip: stomp },
  doubleBounce: {
    name: 'doubleBounce',
    energy: 'high',
    accent: 'bass',
    beats: 2,
    clip: doubleBounce,
  },
  armSwing: { name: 'armSwing', energy: 'high', accent: 'full', beats: 4, clip: armSwing },
  dropBounce: { name: 'dropBounce', energy: 'high', accent: 'bass', beats: 4, clip: dropBounce },
  celebrateGroove: {
    name: 'celebrateGroove',
    energy: 'high',
    accent: 'treble',
    beats: 4,
    clip: celebrateGroove,
  },
  hopSide: { name: 'hopSide', energy: 'high', accent: 'bass', beats: 2, clip: hopSide },
};

export function dancePlaybackRate(def: DanceMoveDef, bpm: number): number {
  const tempo = Math.min(180, Math.max(70, bpm || 118));
  const target = def.beats * (60000 / tempo);
  return def.clip.duration / Math.max(240, target);
}
