import type { ActionName, EmotionName } from '@yuta/shared';

export interface EmotionProfile {
  name: EmotionName;
  expressions: string[];
  actions: ActionName[];
  face: {
    eyeOpen: number;
    eyeSmile: number;
    browY: number;
    mouthForm: number;
    cheek: number;
  };
  head: {
    tiltZ: number;
    bounceY: number;
  };
  voice: {
    pitch: number;
    speed: number;
    energy: number;
  };
}

export const EMOTION_PROFILES: Record<EmotionName, EmotionProfile> = {
  neutral: {
    name: 'neutral',
    expressions: ['rest'],
    actions: ['idle'],
    face: { eyeOpen: 1, eyeSmile: 0, browY: 0, mouthForm: 0, cheek: 0 },
    head: { tiltZ: 0, bounceY: 0 },
    voice: { pitch: 1, speed: 1, energy: 0.45 },
  },
  happy: {
    name: 'happy',
    expressions: ['smile', 'brightEyes'],
    actions: ['laugh', 'nod'],
    face: { eyeOpen: 0.92, eyeSmile: 0.8, browY: 0.25, mouthForm: 0.7, cheek: 0.55 },
    head: { tiltZ: 8, bounceY: 4 },
    voice: { pitch: 1.06, speed: 1.04, energy: 0.8 },
  },
  sad: {
    name: 'sad',
    expressions: ['down'],
    actions: ['headTilt'],
    face: { eyeOpen: 0.78, eyeSmile: 0, browY: -0.35, mouthForm: -0.45, cheek: 0 },
    head: { tiltZ: -10, bounceY: -2 },
    voice: { pitch: 0.94, speed: 0.92, energy: 0.28 },
  },
  surprised: {
    name: 'surprised',
    expressions: ['wideEyes'],
    actions: ['wave'],
    face: { eyeOpen: 1.2, eyeSmile: 0, browY: 0.55, mouthForm: 0.1, cheek: 0.1 },
    head: { tiltZ: 0, bounceY: 6 },
    voice: { pitch: 1.1, speed: 1.08, energy: 0.75 },
  },
  curious: {
    name: 'curious',
    expressions: ['headTilt'],
    actions: ['headTilt', 'nod'],
    face: { eyeOpen: 1.05, eyeSmile: 0.15, browY: 0.2, mouthForm: 0.15, cheek: 0 },
    head: { tiltZ: 14, bounceY: 1 },
    voice: { pitch: 1.03, speed: 1.0, energy: 0.6 },
  },
};
