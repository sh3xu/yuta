import { clamp01 } from '@yuta/shared';

export function createMouthEnvelope(onMouth: (open: number) => void): {
  start: () => void;
  stop: () => void;
} {
  let frame = 0;
  let raf = 0;
  let running = false;

  const tick = (time: number) => {
    if (!running) return;
    const pulse = (Math.sin(time / 70) + 1) / 2;
    const chatter = (Math.sin(time / 28 + frame) + 1) / 2;
    onMouth(clamp01(0.18 + pulse * 0.55 + chatter * 0.25));
    frame += 1;
    raf = requestAnimationFrame(tick);
  };

  return {
    start() {
      running = true;
      raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      onMouth(0);
    },
  };
}
