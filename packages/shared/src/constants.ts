export const APP_ID = 'yuta';
export const APP_NAME = 'Yuta';

export const EMOTIONS = [
  'neutral',
  'happy',
  'sad',
  'surprised',
  'curious',
  'embarrassed',
  'angry',
] as const;
export const ACTIONS = [
  'idle',
  'nod',
  'wave',
  'headTilt',
  'laugh',
  'jump',
  'bow',
  'shrug',
  'lookLeft',
  'lookRight',
  'lookUp',
  'lookDown',
  'think',
  'shy',
  'stretch',
  'celebrate',
  'shakeNo',
  'wink',
  'leanIn',
  'clap',
  'point',
  'gasp',
  'sway',
  'salute',
  'facepalm',
  'fidget',
  'bounce',
  'peek',
  'sleep',
  'blowKiss',
  'dance',
  'coverFace',
  'handsOnHips',
] as const;
export const DANCE_MOVES = [
  'swayGroove',
  'headBob',
  'hipSway',
  'stepTouch',
  'shoulderRoll',
  'leanGroove',
  'lookSweep',
  'bounceGroove',
  'sideStep',
  'armPump',
  'twist',
  'clapStep',
  'waveArms',
  'shuffle',
  'bodyRoll',
  'pointGroove',
  'shimmy',
  'wiggle',
  'kickStep',
  'jumpGroove',
  'fistPump',
  'spinTwist',
  'stomp',
  'doubleBounce',
  'armSwing',
  'dropBounce',
  'celebrateGroove',
  'hopSide',
] as const;

export const MEMORY_CATEGORIES = [
  'profile',
  'preferences',
  'people',
  'experiences',
  'knowledge',
  'private',
] as const;

export const DEFAULT_COMPANION_NAME = 'Yuta';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
export const RECENT_TURN_LIMIT = 12;
export const MEMORY_HIT_LIMIT = 6;
export const BEHAVIOR_WINDOW = 20;

export type EmotionName = (typeof EMOTIONS)[number];
export type ActionName = (typeof ACTIONS)[number];
export type DanceMoveName = (typeof DANCE_MOVES)[number];
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export function isDanceMoveName(value: unknown): value is DanceMoveName {
  return typeof value === 'string' && (DANCE_MOVES as readonly string[]).includes(value);
}

export function isMemoryCategory(value: unknown): value is MemoryCategory {
  return typeof value === 'string' && (MEMORY_CATEGORIES as readonly string[]).includes(value);
}
