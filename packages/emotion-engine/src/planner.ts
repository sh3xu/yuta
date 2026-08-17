import { ACTIONS, type ActionName, type ActionSignal } from '@yuta/shared';

const RULES: Array<{ pattern: RegExp; action: ActionName }> = [
  { pattern: /\b(jump|hop|leap|bounce|skip)\b/i, action: 'jump' },
  { pattern: /\b(wave|waving)\b/i, action: 'wave' },
  { pattern: /\b(nod|nodding)\b/i, action: 'nod' },
  { pattern: /\b(laugh|haha|lol)\b/i, action: 'laugh' },
  { pattern: /\b(tilt|cock your head)\b/i, action: 'headTilt' },
];

export function planAction(message: string): ActionSignal | undefined {
  const hit = RULES.find((rule) => rule.pattern.test(message));
  if (!hit) return undefined;
  return { name: hit.action, intensity: 0.85 };
}

export function isActionName(value: string): value is ActionName {
  return (ACTIONS as readonly string[]).includes(value);
}
