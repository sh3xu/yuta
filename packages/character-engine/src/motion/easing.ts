import { clamp01 } from '@yuta/shared';

export type EaseName =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInBack'
  | 'easeOutBack';

export function ease(name: EaseName, t: number): number {
  const x = clamp01(t);
  switch (name) {
    case 'linear':
      return x;
    case 'easeInQuad':
      return x * x;
    case 'easeOutQuad':
      return 1 - (1 - x) * (1 - x);
    case 'easeInCubic':
      return x * x * x;
    case 'easeOutCubic':
      return 1 - (1 - x) ** 3;
    case 'easeInOutCubic':
      return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
    case 'easeInBack': {
      const c1 = 1.70158;
      return (c1 + 1) * x * x * x - c1 * x * x;
    }
    case 'easeOutBack': {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
    }
  }
}
