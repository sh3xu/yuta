import { clamp01 } from '@yuta/shared';
import { PARAM_REST } from '../live2d/mappings';
import { ease } from './easing';
import { ARM_POSE, type Channel, type MotionClip, type MotionSample } from './types';

const FADE_MS = 180;

export function emptySample(): MotionSample {
  return { add: {}, set: {}, armPose: 0 };
}

export class ClipPlayer {
  private clip: MotionClip | null = null;
  private startedAt = 0;
  private intensity = 1;
  private fadeFrom: MotionSample | null = null;
  private fadeAt = 0;
  private last: MotionSample = emptySample();

  play(clip: MotionClip, intensity: number, now = performance.now()): void {
    this.clip = clip;
    this.startedAt = now;
    this.intensity = clamp01(Math.max(intensity, 0.35));
    this.fadeFrom = null;
  }

  stop(now = performance.now()): void {
    if (this.clip || hasMotion(this.last)) {
      this.fadeFrom = this.last;
      this.fadeAt = now;
    }
    this.clip = null;
  }

  sample(now: number): MotionSample {
    if (this.clip) {
      const elapsed = now - this.startedAt;
      if (elapsed >= this.clip.duration) {
        this.fadeFrom = evaluate(this.clip, this.clip.duration, this.intensity);
        this.fadeAt = now;
        this.clip = null;
      } else {
        this.last = evaluate(this.clip, elapsed, this.intensity);
        return this.last;
      }
    }

    if (this.fadeFrom) {
      const t = clamp01((now - this.fadeAt) / FADE_MS);
      this.last = scaleSample(this.fadeFrom, 1 - t);
      if (t >= 1) this.fadeFrom = null;
      return this.last;
    }

    this.last = emptySample();
    return this.last;
  }
}

function evaluate(clip: MotionClip, time: number, intensity: number): MotionSample {
  const sample = emptySample();

  for (const channel of clip.channels) {
    const raw = sampleChannel(channel, time);
    if (channel.id === ARM_POSE) {
      sample.armPose = raw;
      continue;
    }
    if (channel.mix === 'set') {
      sample.set[channel.id] = mixTowardRest(channel.id, raw, Math.max(intensity, 0.9));
    } else {
      sample.add[channel.id] = raw * Math.max(intensity, 0.8);
    }
  }

  return sample;
}

function sampleChannel(channel: Channel, time: number): number {
  const keys = channel.keys;
  if (keys.length === 0) return 0;
  if (time <= keys[0].t) return keys[0].v;
  const last = keys[keys.length - 1];
  if (time >= last.t) return last.v;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const from = keys[i];
    const to = keys[i + 1];
    if (time > to.t) continue;
    const span = to.t - from.t;
    const u = span <= 0 ? 1 : (time - from.t) / span;
    return from.v + (to.v - from.v) * ease(to.ease ?? 'linear', u);
  }

  return last.v;
}

function scaleSample(from: MotionSample, keep: number): MotionSample {
  const add: Record<string, number> = {};
  const set: Record<string, number> = {};
  for (const [id, value] of Object.entries(from.add)) add[id] = value * keep;
  for (const [id, value] of Object.entries(from.set)) set[id] = mixTowardRest(id, value, keep);
  return { add, set, armPose: from.armPose * keep };
}

function mixTowardRest(id: string, value: number, amount: number): number {
  const rest = PARAM_REST[id] ?? 0;
  return rest + (value - rest) * amount;
}

function hasMotion(sample: MotionSample): boolean {
  return (
    sample.armPose !== 0 || Object.keys(sample.add).length > 0 || Object.keys(sample.set).length > 0
  );
}
