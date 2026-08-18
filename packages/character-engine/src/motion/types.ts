import type { EaseName } from './easing';

export const ARM_POSE = 'armPose';

export interface Keyframe {
  t: number;
  v: number;
  ease?: EaseName;
}

export interface Channel {
  id: string;
  keys: Keyframe[];
  mix?: 'add' | 'set';
}

export interface MotionClip {
  duration: number;
  channels: Channel[];
}

export interface MotionSample {
  add: Record<string, number>;
  set: Record<string, number>;
  armPose: number;
}
