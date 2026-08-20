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

  table.add(PARAM.bodyX, idle.bodyX * idleMix - look.x * 6);
  table.add(PARAM.bodyZ, idle.bodyZ);
  table.add(PARAM.angleZ, idle.angleZ * idleMix);
  table.add(PARAM.angleX, -look.x * 18);
  table.add(PARAM.angleY, look.y * 14);
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

  if (state.dancing) {
    const bounce = state.bassEnergy * 8 + state.beatPulse * 7;
    table.add(PARAM.bodyY, bounce);
    table.add(PARAM.leg, state.bassEnergy * 0.28);
    table.add(PARAM.shoulder, state.beatPulse * 0.25);
    table.add(PARAM.angleZ, Math.sin(now / 160) * state.musicEnergy * 3.5);

    const slow = Math.sin(now / 2400);
    const flap = Math.sin(now / 1750);
    table.add(PARAM.armRA, 5.5 + slow * 2);
    table.add(PARAM.armRB, 5 + flap * 3.2);
    table.add(PARAM.handRB, flap * 4);
    table.add(PARAM.handR, 0.4);
    table.add(PARAM.angleX, 5 + slow * 2);
    table.setArmPose(Math.max(motion.armPose, 0.72));
  } else {
    table.setArmPose(motion.armPose);
  }

  if (state.speaking) table.set(PARAM.mouthOpen, state.mouthOpen);
}
