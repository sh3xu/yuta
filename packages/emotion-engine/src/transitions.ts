import type { EmotionSignal } from '@yuta/shared';
import { clamp01 } from '@yuta/shared';

export function blendEmotion(current: EmotionSignal, next: EmotionSignal): EmotionSignal {
  if (current.name === next.name) {
    return {
      name: next.name,
      intensity: clamp01(current.intensity * 0.35 + next.intensity * 0.65),
    };
  }

  return {
    name: next.name,
    intensity: clamp01(next.intensity * 0.85),
  };
}
