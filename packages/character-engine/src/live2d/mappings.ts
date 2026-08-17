import type { ActionName, EmotionName } from '@yuta/shared';
import { ACTION_PROFILES, EMOTION_PROFILES } from '@yuta/emotion-engine';

export const PARAM = {
  mouthOpen: 'ParamMouthOpenY',
  mouthForm: 'ParamMouthForm',
  eyeLOpen: 'ParamEyeLOpen',
  eyeROpen: 'ParamEyeROpen',
  eyeLSmile: 'ParamEyeLSmile',
  eyeRSmile: 'ParamEyeRSmile',
  browLY: 'ParamBrowLY',
  browRY: 'ParamBrowRY',
  cheek: 'ParamCheek',
  angleX: 'ParamAngleX',
  angleY: 'ParamAngleY',
  angleZ: 'ParamAngleZ',
  bodyX: 'ParamBodyAngleX',
} as const;

export function emotionParams(emotion: EmotionName, intensity: number) {
  const profile = EMOTION_PROFILES[emotion];
  const t = intensity;
  return {
    eyeOpen: 1 + (profile.face.eyeOpen - 1) * t,
    eyeSmile: profile.face.eyeSmile * t,
    browY: profile.face.browY * t,
    mouthForm: profile.face.mouthForm * t,
    cheek: profile.face.cheek * t,
    tiltZ: profile.head.tiltZ * t,
  };
}

export function actionMotion(action: ActionName | null) {
  return ACTION_PROFILES[action ?? 'idle'];
}
