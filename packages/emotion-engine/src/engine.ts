import {
  IDLE_CHARACTER_STATE,
  type ActionSignal,
  type CharacterState,
  type EmotionSignal,
} from '@yuta/shared';
import { ACTION_PROFILES } from './actions';
import { EMOTION_PROFILES } from './emotions';
import { blendEmotion } from './transitions';

export class EmotionEngine {
  private emotion: EmotionSignal = { name: 'neutral', intensity: 0.35 };
  private actionToken = 0;

  currentEmotion(): EmotionSignal {
    return this.emotion;
  }

  apply(input: { emotion: EmotionSignal; action?: ActionSignal }): CharacterState {
    this.emotion = blendEmotion(this.emotion, input.emotion);
    const action = input.action?.name ?? EMOTION_PROFILES[this.emotion.name].actions[0] ?? 'idle';
    const actionIntensity = input.action?.intensity ?? 0.45;
    this.actionToken += 1;

    return {
      ...IDLE_CHARACTER_STATE,
      emotion: this.emotion.name,
      emotionIntensity: this.emotion.intensity,
      action,
      actionIntensity,
      actionToken: this.actionToken,
      speaking: false,
      mouthOpen: 0,
    };
  }

  profile() {
    return {
      emotion: EMOTION_PROFILES[this.emotion.name],
      action: ACTION_PROFILES[this.emotion.name === 'happy' ? 'laugh' : 'idle'],
    };
  }
}
