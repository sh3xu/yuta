import type { ActionName, EmotionName } from '@yuta/shared';

export interface EmotionProfile {
  name: EmotionName;
  expressions: string[];
  actions: ActionName[];
  face: {
    eyeOpen: number;
    eyeSmile: number;
    browY: number;
    browForm: number;
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
    face: { eyeOpen: 1, eyeSmile: 0, browY: 0, browForm: 0, mouthForm: 1, cheek: 0 },
    head: { tiltZ: 0, bounceY: 0 },
    voice: { pitch: 1, speed: 1, energy: 0.45 },
  },
  happy: {
    name: 'happy',
    expressions: ['smile', 'brightEyes'],
    actions: ['laugh', 'bounce'],
    face: { eyeOpen: 1, eyeSmile: 1, browY: 0.55, browForm: 0.35, mouthForm: 1, cheek: 1 },
    head: { tiltZ: 16, bounceY: 4 },
    voice: { pitch: 1.06, speed: 1.04, energy: 0.8 },
  },
  sad: {
    name: 'sad',
    expressions: ['down'],
    actions: ['sleep', 'headTilt'],
    face: { eyeOpen: 0.45, eyeSmile: 0, browY: -1, browForm: -1, mouthForm: -1, cheek: 0 },
    head: { tiltZ: -18, bounceY: -2 },
    voice: { pitch: 0.94, speed: 0.92, energy: 0.28 },
  },
  surprised: {
    name: 'surprised',
    expressions: ['wideEyes'],
    actions: ['gasp'],
    face: { eyeOpen: 1.2, eyeSmile: 0, browY: 1, browForm: 0.6, mouthForm: -0.2, cheek: 0.2 },
    head: { tiltZ: 0, bounceY: 6 },
    voice: { pitch: 1.1, speed: 1.08, energy: 0.75 },
  },
  curious: {
    name: 'curious',
    expressions: ['headTilt'],
    actions: ['think', 'peek'],
    face: { eyeOpen: 1.1, eyeSmile: 0.25, browY: 0.7, browForm: 0.25, mouthForm: 0.2, cheek: 0 },
    head: { tiltZ: 22, bounceY: 1 },
    voice: { pitch: 1.03, speed: 1.0, energy: 0.6 },
  },
};
