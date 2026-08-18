import { useEffect, useRef } from 'react';
import { useCompanionStore } from '../stores/companion-store';
import { stickerMode } from './sticker';
import { restoreWindow, setStickerSize, subscribeUnlockPosition } from './window';

export function useStickerWindow(): void {
  const ready = useCompanionStore((state) => state.ready);
  const settings = useCompanionStore((state) => state.settings);
  const composerOpen = useCompanionStore((state) => state.composerOpen);
  const settingsOpen = useCompanionStore((state) => state.settingsOpen);
  const bubbleVisible = useCompanionStore((state) => state.bubbleVisible);
  const setPositionLocked = useCompanionStore((state) => state.setPositionLocked);
  const restored = useRef(false);

  const mode = stickerMode({
    onboardingComplete: settings.onboardingComplete,
    positionLocked: settings.positionLocked,
    composerOpen,
    settingsOpen,
    bubbleVisible,
  });

  useEffect(() => {
    if (!ready) return;
    void (async () => {
      if (!restored.current) {
        restored.current = true;
        await restoreWindow(useCompanionStore.getState().settings);
      }
      await setStickerSize(mode, useCompanionStore.getState().settings);
    })();
  }, [
    ready,
    mode,
    settings.modelScale,
    settings.cropTop,
    settings.cropBottom,
    settings.cropLeft,
    settings.cropRight,
    settings.dockWidth,
    settings.dockGap,
    settings.dockOffsetY,
  ]);

  useEffect(() => {
    if (!ready) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    void subscribeUnlockPosition(() => {
      void setPositionLocked(false);
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
  }, [ready, setPositionLocked]);
}
