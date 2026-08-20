import { PARAM } from '../live2d/mappings';
import type { EaseName } from './easing';
import { ARM_POSE, type Channel, type Keyframe, type MotionClip } from './types';

export type Key = [number, number] | [number, number, EaseName];

export function keys(...items: Key[]): Keyframe[] {
  return items.map(([t, v, ease]) => (ease ? { t, v, ease } : { t, v }));
}

export function setCh(id: string, ...items: Key[]): Channel {
  return { id, keys: keys(...items), mix: 'set' };
}

export function addCh(id: string, ...items: Key[]): Channel {
  return { id, keys: keys(...items), mix: 'add' };
}

export function clip(duration: number, channels: Channel[], arm: 'A' | 'B' = 'A'): MotionClip {
  if (arm === 'A') return { duration, channels };
  return {
    duration,
    channels: [setCh(ARM_POSE, [0, 1], [duration - 160, 1], [duration, 0]), ...channels],
  };
}

export function loopClip(duration: number, channels: Channel[], arm: 'A' | 'B' = 'A'): MotionClip {
  if (arm === 'A') return { duration, channels };
  return {
    duration,
    channels: [setCh(ARM_POSE, [0, 1], [duration, 1]), ...channels],
  };
}

export function smile(duration: number, peak = 1): Channel[] {
  return [
    setCh(
      PARAM.eyeLSmile,
      [0, 0],
      [140, peak, 'easeOutCubic'],
      [duration - 200, peak * 0.75],
      [duration, peak * 0.2],
    ),
    setCh(
      PARAM.eyeRSmile,
      [0, 0],
      [140, peak, 'easeOutCubic'],
      [duration - 200, peak * 0.75],
      [duration, peak * 0.2],
    ),
    setCh(PARAM.mouthForm, [0, 1], [duration, 1]),
    setCh(
      PARAM.cheek,
      [0, 0],
      [160, peak * 0.85, 'easeOutCubic'],
      [duration - 180, peak * 0.5],
      [duration, peak * 0.15],
    ),
  ];
}

export function waveKeys(
  duration: number,
  cycles: number,
  peak: number,
  rest = 0,
  ease: EaseName = 'easeInOutCubic',
): Key[] {
  const out: Key[] = [[0, rest]];
  const steps = Math.max(1, cycles) * 2;
  for (let i = 1; i <= steps; i += 1) {
    const t = (duration * i) / steps;
    const sign = i % 2 === 1 ? 1 : -1;
    const value = i === steps ? rest : rest + peak * sign;
    out.push([t, value, ease]);
  }
  return out;
}

export function pulseKeys(
  duration: number,
  beats: number,
  peak: number,
  rest = 0,
  ease: EaseName = 'easeOutCubic',
): Key[] {
  const out: Key[] = [[0, rest]];
  const count = Math.max(1, beats);
  for (let i = 0; i < count; i += 1) {
    const hit = ((i + 0.28) * duration) / count;
    const back = ((i + 1) * duration) / count;
    out.push([hit, rest + peak, ease]);
    out.push([back, i === count - 1 ? rest : rest + peak * 0.12, 'easeInCubic']);
  }
  return out;
}

export function waveCh(
  id: string,
  duration: number,
  cycles: number,
  peak: number,
  rest = 0,
): Channel {
  return setCh(id, ...waveKeys(duration, cycles, peak, rest));
}

export function pulseCh(
  id: string,
  duration: number,
  beats: number,
  peak: number,
  rest = 0,
): Channel {
  return setCh(id, ...pulseKeys(duration, beats, peak, rest));
}
