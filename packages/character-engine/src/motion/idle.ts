export interface IdleSample {
  bodyX: number;
  bodyZ: number;
  angleZ: number;
  eyeBallX: number;
  eyeBallY: number;
}

export function sampleIdle(now: number): IdleSample {
  const wander = 0.5 + 0.5 * Math.sin(now / 9200);
  return {
    bodyX: Math.sin(now / 4100) * 2.4,
    bodyZ: Math.sin(now / 3340) * 3.2,
    angleZ: Math.sin(now / 5200) * 4,
    eyeBallX: Math.sin(now / 5400) * 0.42 * wander,
    eyeBallY: Math.sin(now / 6100) * 0.28 * wander,
  };
}
