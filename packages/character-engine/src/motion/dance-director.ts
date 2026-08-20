import type { DanceMoveName } from '@yuta/shared';
import {
  DANCE_LIBRARY,
  type DanceAccent,
  type DanceEnergy,
  type DanceMoveDef,
} from './dance-clips';

export interface DanceDirectorInput {
  energy: number;
  bass: number;
  mid: number;
  treble: number;
  beatPulse: number;
  previous: DanceMoveName | null;
}

const MOVES = Object.values(DANCE_LIBRARY);

export function selectDanceMove(input: DanceDirectorInput): DanceMoveName {
  if (input.beatPulse > 0.88 && input.bass > 0.55 && input.energy > 0.6) {
    return pick(['jumpGroove', 'stomp', 'fistPump', 'hopSide'], input.previous);
  }

  const energy = energyBand(input.energy);
  const accent = dominantAccent(input);
  const matched = MOVES.filter((move) => move.energy === energy && matchesAccent(move, accent));
  const pool = matched.length > 0 ? matched : MOVES.filter((move) => move.energy === energy);
  const names = (pool.length > 0 ? pool : MOVES).map((move) => move.name);
  return pick(names, input.previous);
}

export function energyBand(energy: number): DanceEnergy {
  if (energy >= 0.58) return 'high';
  if (energy >= 0.28) return 'mid';
  return 'low';
}

function dominantAccent(input: DanceDirectorInput): DanceAccent {
  const { bass, mid, treble } = input;
  const top = Math.max(bass, mid, treble);
  if (top < 0.12) return 'full';
  if (bass === top && bass > mid * 1.12 && bass > treble * 1.12) return 'bass';
  if (treble === top && treble > mid * 1.1) return 'treble';
  if (mid === top) return 'mid';
  return 'full';
}

function matchesAccent(move: DanceMoveDef, accent: DanceAccent): boolean {
  return move.accent === accent || move.accent === 'full' || accent === 'full';
}

function pick(names: DanceMoveName[], previous: DanceMoveName | null): DanceMoveName {
  const options = names.filter((name) => name !== previous);
  const pool = options.length > 0 ? options : names;
  return pool[Math.floor(Math.random() * pool.length)] ?? 'swayGroove';
}
