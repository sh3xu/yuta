import type { ActionName, EmotionName } from '@yuta/shared';

export interface PackMotion {
  File: string;
  FadeInTime: number;
  FadeOutTime: number;
  body: number;
  loop: boolean;
}

export type MotionGroups = Record<string, PackMotion[]>;

const FADE = 0.2;
// NOTE: Hiyori pose crossfades PartArmA and PartArmB over 0.5s and draws both while it does. m06 and m08 are the folded-hands set; every other clip, including the pack, is arms-down.
const FOLDED_ARM_MOTIONS = ['Hiyori_m06.motion3.json', 'Hiyori_m08.motion3.json'];
const BODY_MIN = 4;
const BODY_PARAMS = [
  'ParamBodyAngleX',
  'ParamBodyAngleY',
  'ParamBodyAngleZ',
  'ParamArmLA',
  'ParamArmRA',
  'ParamArmLB',
  'ParamArmRB',
];

export interface MotionRequest {
  group: string;
  hint: string;
}

export interface BodyMotion {
  group: string;
  index: number;
  file: string;
}

interface MotionJson {
  Meta?: { Loop?: boolean };
  Curves?: { Target?: string; Id?: string; Segments?: number[] }[];
}

// NOTE: group is the filename prefix. Keep it off the Cubism "Idle" name so the engine does not auto-play face-only clips.
export async function loadMotionGroups(files: string[], modelUrl: string): Promise<MotionGroups> {
  const base = new URL(modelUrl, window.location.href);
  const loaded = await Promise.all(
    files.map(async (file) => {
      const name =
        file
          .split('/')
          .pop()
          ?.replace(/\.motion3\.json$/i, '') ?? '';
      const prefix = name.split('_')[0] ?? '';
      if (!prefix) return null;
      const response = await fetch(new URL(file, base));
      if (!response.ok) return null;
      const json = (await response.json()) as MotionJson;
      const entry: PackMotion = {
        File: file,
        FadeInTime: FADE,
        FadeOutTime: FADE,
        body: bodySpan(json),
        loop: json.Meta?.Loop === true,
      };
      return { group: prefix, entry };
    }),
  );
  const groups: MotionGroups = {};
  for (const item of loaded) {
    if (!item) continue;
    groups[item.group] = [...(groups[item.group] ?? []), item.entry];
  }
  return groups;
}

export function withoutFoldedArmMotions<T extends { File: string }>(entries: T[]): T[] {
  return entries.filter(
    (entry) => !FOLDED_ARM_MOTIONS.some((name) => entry.File.endsWith(name)),
  );
}

export function bodyMotions(groups: MotionGroups): BodyMotion[] {
  const playlist: BodyMotion[] = [];
  for (const [group, entries] of Object.entries(groups)) {
    entries.forEach((entry, index) => {
      if (entry.body < BODY_MIN) return;
      playlist.push({ group, index, file: entry.File });
    });
  }
  return playlist;
}

export function emotionBodyHints(emotion: EmotionName): string[] {
  switch (emotion) {
    case 'happy':
      return ['happy', 'excited'];
    case 'sad':
      return ['sad'];
    case 'surprised':
      return ['surprised', 'excited'];
    case 'curious':
      return ['sway', 'look'];
    case 'embarrassed':
      return ['shy'];
    case 'angry':
      return ['angry'];
    default:
      return [];
  }
}

function bodySpan(json: MotionJson): number {
  let span = 0;
  for (const curve of json.Curves ?? []) {
    if (curve.Target !== 'Parameter' || !curve.Id || !BODY_PARAMS.includes(curve.Id)) continue;
    const values = parameterValues(curve.Segments ?? []);
    if (values.length === 0) continue;
    span = Math.max(span, Math.max(...values) - Math.min(...values));
  }
  return span;
}

function parameterValues(segments: number[]): number[] {
  const values: number[] = [];
  if (segments.length < 2) return values;
  values.push(segments[1] ?? 0);
  let index = 2;
  while (index < segments.length) {
    const type = segments[index];
    if (type === 1) {
      values.push(segments[index + 2] ?? 0, segments[index + 4] ?? 0, segments[index + 6] ?? 0);
      index += 7;
    } else if (type === 0 || type === 2 || type === 3) {
      values.push(segments[index + 2] ?? 0);
      index += 3;
    } else {
      break;
    }
  }
  return values;
}

export function pickMotionIndex(group: PackMotion[], hint: string, avoid: number | null): number {
  if (group.length === 0) return -1;
  const hinted = hint
    ? group.flatMap((entry, index) =>
        entry.File.toLowerCase().includes(hint.toLowerCase()) ? [index] : [],
      )
    : [];
  const pool = hinted.length > 0 ? hinted : group.map((_, index) => index);
  const choices = avoid === null ? pool : pool.filter((index) => index !== avoid);
  const list = choices.length > 0 ? choices : pool;
  return list[Math.floor(Math.random() * list.length)] ?? 0;
}

export function actionMotionRequest(action: ActionName): MotionRequest {
  switch (action) {
    case 'nod':
      return { group: 'nod', hint: '' };
    case 'wave':
      return { group: 'greet', hint: 'hello' };
    case 'headTilt':
      return { group: 'confused', hint: 'tilt' };
    case 'laugh':
      return { group: 'happy', hint: 'giggle' };
    case 'jump':
      return { group: 'surprised', hint: 'jump' };
    case 'bow':
      return { group: 'greet', hint: 'bow' };
    case 'shrug':
      return { group: 'confused', hint: 'shake' };
    case 'lookLeft':
    case 'lookRight':
    case 'lookUp':
    case 'lookDown':
      return { group: 'idle', hint: 'look' };
    case 'think':
      return { group: 'think', hint: '' };
    case 'shy':
      return { group: 'shy', hint: '' };
    case 'stretch':
      return { group: 'idle', hint: 'breath' };
    case 'celebrate':
    case 'clap':
    case 'dance':
      return { group: 'excited', hint: '' };
    case 'shakeNo':
      return { group: 'shake', hint: '' };
    case 'wink':
      return { group: 'wink', hint: '' };
    case 'leanIn':
      return { group: 'talk', hint: 'neutral' };
    case 'point':
    case 'salute':
      return { group: 'greet', hint: 'hello' };
    case 'gasp':
      return { group: 'surprised', hint: 'gasp' };
    case 'sway':
      return { group: 'idle', hint: 'sway' };
    case 'facepalm':
    case 'coverFace':
      return { group: 'shy', hint: 'blush' };
    case 'fidget':
      return { group: 'shy', hint: 'fidget' };
    case 'bounce':
      return { group: 'happy', hint: 'bounce' };
    case 'peek':
      return { group: 'shy', hint: 'peek' };
    case 'sleep':
      return { group: 'sleepy', hint: '' };
    case 'blowKiss':
      return { group: 'love', hint: '' };
    case 'handsOnHips':
      return { group: 'smug', hint: '' };
    default:
      return { group: 'idle', hint: '' };
  }
}
