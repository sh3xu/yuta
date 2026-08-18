import { Live2DRenderer } from '@yuta/character-engine';
import { useEffect, useRef } from 'react';
import { visibleStage, WINDOW_PAD } from '../../lib/sticker';
import { isTauri } from '../../lib/tauri-fs';
import {
  getOuterPosition,
  getScaleFactor,
  startWindowDrag,
  subscribeCursorMove,
} from '../../lib/window';
import { useCompanionStore } from '../../stores/companion-store';

const MODEL_URL = '/characters/hiyori/Hiyori.model3.json';
const DRAG_THRESHOLD = 6;

export function CharacterStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Live2DRenderer | null>(null);
  const dragRef = useRef({ active: false, dragging: false, x: 0, y: 0 });
  const winRef = useRef({ x: 0, y: 0, scale: 1 });
  const followRef = useRef(true);
  const headRef = useRef({ x: 0, y: 0 });
  const characterState = useCompanionStore((state) => state.characterState);
  const settings = useCompanionStore((state) => state.settings);
  const positionLocked = settings.positionLocked;
  const toggleChat = useCompanionStore((state) => state.toggleChat);
  const stage = visibleStage(settings);

  followRef.current = settings.followCursor;
  headRef.current = {
    x: WINDOW_PAD + (stage.layoutWidth * 0.5 - stage.cropLeftPx),
    y: WINDOW_PAD + (stage.layoutHeight * 0.18 - stage.cropTopPx),
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const renderer = new Live2DRenderer();
    rendererRef.current = renderer;
    void renderer
      .mount(host, MODEL_URL)
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
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.applyState(characterState);
  }, [characterState]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    void subscribeCursorMove((point) => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      if (!followRef.current) {
        renderer.setLookTarget(0, 0);
        return;
      }
      const win = winRef.current;
      const headX = win.x + headRef.current.x * win.scale;
      const headY = win.y + headRef.current.y * win.scale;
      const reachX = 420 * win.scale;
      const reachY = 320 * win.scale;
      renderer.setLookTarget(
        clamp((point.x - headX) / reachX, -1, 1),
        clamp((headY - point.y) / reachY, -1, 1),
      );
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
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Companion"
      className={`relative block shrink-0 overflow-hidden border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-accent ${positionLocked ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
      style={{ width: stage.width, height: stage.height }}
      onClick={() => {
        if (dragRef.current.dragging) return;
        toggleChat();
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        dragRef.current = {
          active: true,
          dragging: false,
          x: event.clientX,
          y: event.clientY,
        };
        const locked = useCompanionStore.getState().settings.positionLocked;
        const onMove = (move: PointerEvent) => {
          if (!dragRef.current.active || locked || dragRef.current.dragging) return;
          const dx = move.clientX - dragRef.current.x;
          const dy = move.clientY - dragRef.current.y;
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
          dragRef.current.dragging = true;
          void startWindowDrag();
        };
        const onUp = () => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          dragRef.current.active = false;
          if (dragRef.current.dragging) {
            window.setTimeout(() => {
              dragRef.current.dragging = false;
            }, 0);
          }
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: stage.layoutWidth,
          height: stage.layoutHeight,
          transform: `translate(${-stage.cropLeftPx}px, ${-stage.cropTopPx}px)`,
        }}
      >
        <div ref={hostRef} className="h-full w-full" />
      </div>
    </button>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
