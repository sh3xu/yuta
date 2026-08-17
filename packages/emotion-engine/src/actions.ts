import type { ActionName } from '@yuta/shared';

export interface ActionProfile {
  name: ActionName;
  motionGroup: 'Idle' | 'TapBody';
  motionIndex?: number;
  headNod: number;
  headTilt: number;
  hop: number;
}

export const ACTION_PROFILES: Record<ActionName, ActionProfile> = {
  idle: { name: 'idle', motionGroup: 'Idle', motionIndex: 0, headNod: 0, headTilt: 0, hop: 0 },
  nod: { name: 'nod', motionGroup: 'Idle', motionIndex: 2, headNod: 12, headTilt: 0, hop: 0 },
  wave: { name: 'wave', motionGroup: 'TapBody', motionIndex: 0, headNod: 0, headTilt: 4, hop: 0 },
  headTilt: { name: 'headTilt', motionGroup: 'Idle', motionIndex: 1, headNod: 0, headTilt: 16, hop: 0 },
  laugh: { name: 'laugh', motionGroup: 'Idle', motionIndex: 4, headNod: 6, headTilt: 8, hop: 0 },
  jump: { name: 'jump', motionGroup: 'TapBody', motionIndex: 0, headNod: 8, headTilt: 0, hop: 1 },
};
