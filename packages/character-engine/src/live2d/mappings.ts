import { ACTION_PROFILES, EMOTION_PROFILES } from '@yuta/emotion-engine';
import type { ActionName, EmotionName } from '@yuta/shared';

export const PARAM = {
  mouthOpen: 'ParamMouthOpenY',
  mouthForm: 'ParamMouthForm',
  eyeLOpen: 'ParamEyeLOpen',
  eyeROpen: 'ParamEyeROpen',
  eyeLSmile: 'ParamEyeLSmile',
  eyeRSmile: 'ParamEyeRSmile',
  eyeBallX: 'ParamEyeBallX',
  eyeBallY: 'ParamEyeBallY',
  browLY: 'ParamBrowLY',
  browRY: 'ParamBrowRY',
  cheek: 'ParamCheek',
  angleX: 'ParamAngleX',
  angleY: 'ParamAngleY',
  angleZ: 'ParamAngleZ',
  bodyX: 'ParamBodyAngleX',
  bodyY: 'ParamBodyAngleY',
  bodyZ: 'ParamBodyAngleZ',
  breath: 'ParamBreath',
  shoulder: 'ParamShoulder',
  leg: 'ParamLeg',
  armLA: 'ParamArmLA',
  armRA: 'ParamArmRA',
  armLB: 'ParamArmLB',
  armRB: 'ParamArmRB',
  handLB: 'ParamHandLB',
  handRB: 'ParamHandRB',
  handL: 'ParamHandL',
  handR: 'ParamHandR',
  browLX: 'ParamBrowLX',
  browRX: 'ParamBrowRX',
  browLAngle: 'ParamBrowLAngle',
  browRAngle: 'ParamBrowRAngle',
  browLForm: 'ParamBrowLForm',
  browRForm: 'ParamBrowRForm',
} as const;

export const PART = {
  armA: 'PartArmA',
  armB: 'PartArmB',
} as const;

export const BODY_REST: Record<string, number> = {
  [PARAM.armLA]: -10,
  [PARAM.armRA]: -10,
  [PARAM.armLB]: 0,
  [PARAM.armRB]: 0,
  [PARAM.handLB]: 0,
  [PARAM.handRB]: 0,
  [PARAM.handL]: 0,
  [PARAM.handR]: 0,
  [PARAM.shoulder]: 0,
  [PARAM.leg]: 1,
  [PARAM.bodyY]: 0,
  [PARAM.bodyZ]: 0,
};

export const PARAM_REST: Record<string, number> = {
  ...BODY_REST,
  [PARAM.eyeLOpen]: 1,
  [PARAM.eyeROpen]: 1,
  [PARAM.mouthOpen]: 0,
  [PARAM.mouthForm]: 1,
  [PARAM.eyeLSmile]: 0,
  [PARAM.eyeRSmile]: 0,
  [PARAM.cheek]: 0,
  [PARAM.browLY]: 0,
  [PARAM.browRY]: 0,
  [PARAM.browLForm]: 0,
  [PARAM.browRForm]: 0,
  [PARAM.angleX]: 0,
  [PARAM.angleY]: 0,
  [PARAM.angleZ]: 0,
  [PARAM.bodyX]: 0,
};

export function emotionParams(emotion: EmotionName, intensity: number) {
  const profile = EMOTION_PROFILES[emotion];
  const t = intensity;
  return {
    eyeOpen: 1 + (profile.face.eyeOpen - 1) * t,
    eyeSmile: profile.face.eyeSmile * t,
    browY: profile.face.browY * t,
    browForm: profile.face.browForm * t,
    mouthForm: 1 + (profile.face.mouthForm - 1) * t,
    cheek: profile.face.cheek * t,
    tiltZ: profile.head.tiltZ * t,
  };
}

export function actionMotion(action: ActionName | null) {
  return ACTION_PROFILES[action ?? 'idle'];
}
