import { ACTIONS, type ActionName, type ActionSignal } from '@yuta/shared';

const RULES: Array<{ pattern: RegExp; action: ActionName }> = [
  { pattern: /\b(look up|glance up)\b/i, action: 'lookUp' },
  { pattern: /\b(look down|glance down)\b/i, action: 'lookDown' },
  { pattern: /\b(look left|glance left)\b/i, action: 'lookLeft' },
  { pattern: /\b(look right|glance right)\b/i, action: 'lookRight' },
  { pattern: /\b(shake (your )?head|nope|disagree)\b/i, action: 'shakeNo' },
  { pattern: /\b(blow (a )?kiss)\b/i, action: 'blowKiss' },
  { pattern: /\b(facepalm|face palm)\b/i, action: 'facepalm' },
  { pattern: /\b(salute)\b/i, action: 'salute' },
  { pattern: /\b(clap|applause)\b/i, action: 'clap' },
  { pattern: /\b(point|pointing)\b/i, action: 'point' },
  { pattern: /\b(gasp|whoa|startle)\b/i, action: 'gasp' },
  { pattern: /\b(dance|groove)\b/i, action: 'dance' },
  { pattern: /\b(sway|wiggle)\b/i, action: 'sway' },
  { pattern: /\b(peek|sneak(y)? look)\b/i, action: 'peek' },
  { pattern: /\b(sleep|sleepy|tired)\b/i, action: 'sleep' },
  { pattern: /\b(fidget|nervous|restless)\b/i, action: 'fidget' },
  { pattern: /\b(bounce|hop in place)\b/i, action: 'bounce' },
  { pattern: /\b(celebrate|cheer|hooray)\b/i, action: 'celebrate' },
  { pattern: /\b(stretch|yawn)\b/i, action: 'stretch' },
  { pattern: /\b(shrug|dunno|i don'?t know)\b/i, action: 'shrug' },
  { pattern: /\b(bow|curtsy)\b/i, action: 'bow' },
  { pattern: /\b(wink)\b/i, action: 'wink' },
  { pattern: /\b(lean in|lean closer)\b/i, action: 'leanIn' },
  { pattern: /\b(think|hmm|ponder)\b/i, action: 'think' },
  { pattern: /\b(shy|embarrassed|blush)\b/i, action: 'shy' },
  { pattern: /\b(jump|hop|leap)\b/i, action: 'jump' },
  { pattern: /\b(wave|waving)\b/i, action: 'wave' },
  { pattern: /\b(nod|nodding|agree)\b/i, action: 'nod' },
  { pattern: /\b(laugh|haha|lol)\b/i, action: 'laugh' },
  { pattern: /\b(tilt|cock your head)\b/i, action: 'headTilt' },
];

export function planAction(message: string): ActionSignal | undefined {
  const hit = RULES.find((rule) => rule.pattern.test(message));
  if (!hit) return undefined;
  return { name: hit.action, intensity: 1 };
}

export function isActionName(value: string): value is ActionName {
  return (ACTIONS as readonly string[]).includes(value);
}
