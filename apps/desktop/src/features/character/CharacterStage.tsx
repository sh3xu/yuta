import { Live2DRenderer } from '@yuta/character-engine';
import type { ActionName } from '@yuta/shared';
import { useEffect, useRef } from 'react';
import { MOTION_PACK_FILES } from '../../lib/motion-pack';
import { visibleStage } from '../../lib/sticker';
import { isTauri } from '../../lib/tauri-fs';
import {
  getOuterPosition,
  getScaleFactor,
  setIgnoreCursorEvents,
  subscribeCursorMove,
  subscribePointerGesture,
} from '../../lib/window';
import { useCompanionStore } from '../../stores/companion-store';

const MODEL_URL = '/characters/hiyori/Hiyori.model3.json';
const GESTURE_GAP_MS = 700;

type CursorPoint = {
  x: number;
  y: number;
  screenX?: number;
  screenY?: number;
  screenW?: number;
  screenH?: number;
};

function cursorScreen(point: CursorPoint, scale: number): { x: number; y: number; width: number; height: number } {
  if (point.screenW && point.screenH) {
    return {
      x: point.screenX ?? 0,
      y: point.screenY ?? 0,
      width: point.screenW,
      height: point.screenH,
    };
  }
  const pixelScale = scale || window.devicePixelRatio || 1;
  const screen = window.screen as Screen & { availLeft?: number; availTop?: number };
  return {
    x: (screen.availLeft ?? 0) * pixelScale,
    y: (screen.availTop ?? 0) * pixelScale,
    width: Math.max(1, window.screen.width * pixelScale),
    height: Math.max(1, window.screen.height * pixelScale),
  };
}

function overCharacter(
  x: number,
  y: number,
  win: { x: number; y: number; scale: number },
  host: HTMLElement | null,
): boolean {
  if (!host) return false;
  const rect = host.getBoundingClientRect();
  const scale = win.scale || 1;
  const clientX = (x - win.x) / scale;
  const clientY = (y - win.y) / scale;
  return clientX >= rect.left && clientY >= rect.top && clientX <= rect.right && clientY <= rect.bottom;
}

export function CharacterStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Live2DRenderer | null>(null);
  const winRef = useRef({ x: 0, y: 0, scale: 1 });
  const followRef = useRef(true);
  const ignoreRef = useRef(true);
  const characterState = useCompanionStore((state) => state.characterState);
  const settings = useCompanionStore((state) => state.settings);
  const gesture = useCompanionStore((state) => state.gesture);
  const gestureAt = useRef(0);
  const stage = visibleStage(settings);

  followRef.current = settings.followCursor;

  useEffect(() => {
    void setIgnoreCursorEvents(true);
    const host = hostRef.current;
    if (!host) return;
    const renderer = new Live2DRenderer();
    rendererRef.current = renderer;
    void renderer
      .mount(host, MODEL_URL, MOTION_PACK_FILES)
      .then(() => {
        if (rendererRef.current !== renderer) return;
        renderer.applyState(useCompanionStore.getState().characterState);
      })
      .catch((error: unknown) => {
        console.error('Live2D failed to load', error);
      });
    return () => {
      renderer.destroy();
      rendererRef.current = null;
      void setIgnoreCursorEvents(true);
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.applyState(characterState);
  }, [characterState]);

  useEffect(() => {
    rendererRef.current?.setLookEnabled(settings.followCursor);
    if (!settings.followCursor) rendererRef.current?.setLookTarget(0, 0);
  }, [settings.followCursor]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (isTauri()) {
        const position = await getOuterPosition();
        const scale = await getScaleFactor();
        if (!cancelled && position) winRef.current = { x: position.x, y: position.y, scale };
        return;
      }
      winRef.current = {
        x: window.screenX,
        y: window.screenY,
        scale: window.devicePixelRatio || 1,
      };
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 400);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [stage.width, stage.height]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    const applyIgnore = (ignore: boolean) => {
      if (!isTauri() || ignoreRef.current === ignore) return;
      ignoreRef.current = ignore;
      void setIgnoreCursorEvents(ignore);
    };
    void setIgnoreCursorEvents(true);
    void subscribeCursorMove((point) => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      const win = winRef.current;
      const scale = win.scale || 1;
      const clientX = (point.x - win.x) / scale;
      const clientY = (point.y - win.y) / scale;
      const overUi = Boolean(document.elementFromPoint(clientX, clientY)?.closest('[data-yuta-hit="ui"]'));
      applyIgnore(!overUi);
      renderer.setLookEnabled(followRef.current);
      if (!followRef.current) {
        renderer.setLookTarget(0, 0);
        return;
      }
      const screen = cursorScreen(point, win.scale);
      const x = ((point.x - screen.x) / screen.width) * 2 - 1;
      const y = 1 - ((point.y - screen.y) / screen.height) * 2;
      renderer.setLookTarget(x, y);
    }).then((fn) => {
      if (cancelled) {
        fn();
        return;
      }
      unlisten = fn;
    });
    return () => {
      cancelled = true;
      unlisten?.();
      ignoreRef.current = true;
      void setIgnoreCursorEvents(true);
    };
  }, []);

  useEffect(() => {
    const play = (action: ActionName) => {
      const now = performance.now();
      if (now - gestureAt.current < GESTURE_GAP_MS) return;
      gestureAt.current = now;
      gesture(action);
    };
    let unlistenGesture: (() => void) | undefined;
    let gestureCancelled = false;
    void subscribePointerGesture((gesture) => {
      if (!overCharacter(gesture.x, gesture.y, winRef.current, hostRef.current)) return;
      if (gesture.kind === 'left') play('wave');
      else if (gesture.kind === 'right') play('wink');
      else play(gesture.delta > 0 ? 'headTilt' : 'nod');
    }).then((fn) => {
      if (gestureCancelled) {
        fn();
        return;
      }
      unlistenGesture = fn;
    });
    return () => {
      gestureCancelled = true;
      unlistenGesture?.();
    };
  }, [gesture]);

  return (
    <div
      className="pointer-events-none relative block shrink-0 overflow-hidden"
      style={{ width: stage.width, height: stage.height }}
      aria-hidden
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: stage.layoutWidth,
          height: stage.layoutHeight,
          transform: `translate(${-stage.cropLeftPx}px, ${-stage.cropTopPx}px)`,
        }}
      >
        <div ref={hostRef} className="pointer-events-none h-full w-full" />
      </div>
    </div>
  );
}
