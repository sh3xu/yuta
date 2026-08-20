import { Live2DRenderer } from '@yuta/character-engine';
import { useEffect, useRef } from 'react';
import { visibleStage, WINDOW_PAD } from '../../lib/sticker';
import { isTauri } from '../../lib/tauri-fs';
import {
  getOuterPosition,
  getScaleFactor,
  setIgnoreCursorEvents,
  startWindowDrag,
  subscribeCursorMove,
} from '../../lib/window';
import { useCompanionStore } from '../../stores/companion-store';

const MODEL_URL = '/characters/hiyori/Hiyori.model3.json';
const DRAG_THRESHOLD = 6;

function uiHitAt(clientX: number, clientY: number): boolean {
  return Boolean(document.elementFromPoint(clientX, clientY)?.closest('[data-yuta-hit="ui"]'));
}

export function CharacterStage({ onActivate }: { onActivate?: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Live2DRenderer | null>(null);
  const dragRef = useRef({ active: false, dragging: false, x: 0, y: 0 });
  const winRef = useRef({ x: 0, y: 0, scale: 1 });
  const followRef = useRef(true);
  const headRef = useRef({ x: 0, y: 0 });
  const ignoreRef = useRef(true);
  const activateRef = useRef(onActivate);
  const characterState = useCompanionStore((state) => state.characterState);
  const settings = useCompanionStore((state) => state.settings);
  const toggleChat = useCompanionStore((state) => state.toggleChat);
  const wave = useCompanionStore((state) => state.wave);
  const stage = visibleStage(settings);
  activateRef.current = onActivate;

  followRef.current = settings.followCursor;
  headRef.current = {
    x: WINDOW_PAD + (stage.layoutWidth * 0.5 - stage.cropLeftPx),
    y: WINDOW_PAD + (stage.layoutHeight * 0.18 - stage.cropTopPx),
  };

  useEffect(() => {
    ignoreRef.current = true;
    void setIgnoreCursorEvents(true);
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
      ignoreRef.current = true;
      void setIgnoreCursorEvents(true);
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
  }, [stage.width, stage.height]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    const applyIgnore = (ignore: boolean) => {
      if (!isTauri() || ignoreRef.current === ignore) return;
      ignoreRef.current = ignore;
      void setIgnoreCursorEvents(ignore);
    };
    void subscribeCursorMove((point) => {
      const renderer = rendererRef.current;
      if (!renderer) return;
      const win = winRef.current;
      const clientX = (point.x - win.x) / win.scale;
      const clientY = (point.y - win.y) / win.scale;
      const overUi = uiHitAt(clientX, clientY);
      const overModel = renderer.hitTest(clientX, clientY);
      applyIgnore(!overUi && !overModel && !dragRef.current.active);
      if (!followRef.current) {
        renderer.setLookTarget(0, 0);
        return;
      }
      if (overModel) {
        renderer.setLookTarget(0, 0);
        return;
      }
      const headX = win.x + headRef.current.x * win.scale;
      const headY = win.y + headRef.current.y * win.scale;
      const dx = point.x - headX;
      const dy = headY - point.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        renderer.setLookTarget(0, 0);
        return;
      }
      const reach = 72 * win.scale;
      const strength = Math.min(1, dist / reach);
      renderer.setLookTarget((dx / dist) * strength, (dy / dist) * strength);
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
    const onCharacter = (clientX: number, clientY: number) => {
      if (uiHitAt(clientX, clientY)) return false;
      return rendererRef.current?.hitTest(clientX, clientY) ?? false;
    };
    const onClick = (event: MouseEvent) => {
      if (dragRef.current.dragging) return;
      if (!onCharacter(event.clientX, event.clientY)) return;
      activateRef.current?.();
      wave();
      toggleChat();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (!onCharacter(event.clientX, event.clientY)) return;
      activateRef.current?.();
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
    };
    window.addEventListener('click', onClick, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [toggleChat, wave]);

  useEffect(() => {
    const hello = window.setTimeout(() => {
      const live = useCompanionStore.getState();
      if (live.characterState.dancing || live.characterState.speaking) return;
      live.wave();
    }, 45000);
    const timer = window.setInterval(() => {
      const live = useCompanionStore.getState();
      if (live.characterState.dancing || live.characterState.speaking || live.composerOpen) return;
      live.wave();
    }, 180000);
    return () => {
      window.clearTimeout(hello);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="pointer-events-none relative block shrink-0 overflow-hidden" style={{ width: stage.width, height: stage.height }} aria-hidden>
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
