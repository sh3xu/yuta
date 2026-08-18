import type { CharacterState } from '@yuta/shared';
import { type MotionSample, sampleIdle } from '../motion';
import { BODY_REST, emotionParams, PARAM } from './mappings';
import type { ParamTable } from './params';

export interface LookTarget {
  x: number;
  y: number;
}

export function applyLive2D(
  table: ParamTable,
  state: CharacterState,
  motion: MotionSample,
  now: number,
  look: LookTarget = { x: 0, y: 0 },
): void {
  const idle = sampleIdle(now);
  const face = emotionParams(state.emotion, state.emotionIntensity);
  const lookMix = Math.min(1, Math.hypot(look.x, look.y));
  const idleMix = 1 - lookMix * 0.85;

  for (const [id, value] of Object.entries(BODY_REST)) table.set(id, value);

  table.add(PARAM.bodyX, idle.bodyX * idleMix - look.x * 12);
  table.add(PARAM.bodyZ, idle.bodyZ);
  table.add(PARAM.angleZ, idle.angleZ * idleMix);
  table.add(PARAM.angleX, -look.x * 30);
  table.add(PARAM.angleY, look.y * 22);
  table.add(PARAM.eyeBallX, idle.eyeBallX * idleMix + look.x);
  table.add(PARAM.eyeBallY, idle.eyeBallY * idleMix + look.y * 0.85);

  table.set(PARAM.eyeLSmile, face.eyeSmile);
  table.set(PARAM.eyeRSmile, face.eyeSmile);
  table.set(PARAM.browLY, face.browY);
  table.set(PARAM.browRY, face.browY);
  table.set(PARAM.browLForm, face.browForm);
  table.set(PARAM.browRForm, face.browForm);
  table.set(PARAM.browLAngle, face.browForm);
  table.set(PARAM.browRAngle, face.browForm);
  table.set(PARAM.mouthForm, face.mouthForm);
  table.set(PARAM.cheek, face.cheek);
  table.add(PARAM.angleZ, face.tiltZ);
  table.add(PARAM.eyeLOpen, face.eyeOpen - 1);
  table.add(PARAM.eyeROpen, face.eyeOpen - 1);

  for (const [id, value] of Object.entries(motion.add)) table.add(id, value);
  for (const [id, value] of Object.entries(motion.set)) table.set(id, value);

  if (state.speaking) table.set(PARAM.mouthOpen, state.mouthOpen);

  table.setArmPose(motion.armPose);
}
