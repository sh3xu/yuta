import type { CharacterState } from '@yuta/shared';

export interface CharacterRenderer {
  mount(host: HTMLElement, modelUrl: string): Promise<void>;
  applyState(state: CharacterState): void;
  destroy(): void;
}
