export interface IdleSample {
  bodyX: number;
  bodyZ: number;
  angleZ: number;
  eyeBallX: number;
  eyeBallY: number;
}

export function sampleIdle(now: number): IdleSample {
  return {
    bodyX: Math.sin(now / 5200) * 0.7,
    bodyZ: Math.sin(now / 4300) * 0.9,
    angleZ: Math.sin(now / 6800) * 1.2,
    eyeBallX: Math.sin(now / 8600) * 0.12,
    eyeBallY: Math.sin(now / 9400) * 0.08,
  };
}
