import { useEffect, useRef } from 'react';
import { useCompanionStore } from '../stores/companion-store';
import { stickerMode } from './sticker';
import { restoreWindow, setStickerSize, subscribePositionLocked, subscribeUnlockPosition } from './window';

export function useStickerWindow(): void {
  const ready = useCompanionStore((state) => state.ready);
  const settings = useCompanionStore((state) => state.settings);
  const composerOpen = useCompanionStore((state) => state.composerOpen);
  const sending = useCompanionStore((state) => state.sending);
  const bubbleVisible = useCompanionStore((state) => state.bubbleVisible);
  const setPositionLocked = useCompanionStore((state) => state.setPositionLocked);
  const restored = useRef(false);

  const mode = stickerMode({
    onboardingComplete: settings.onboardingComplete,
    positionLocked: settings.positionLocked,
    composerOpen,
    bubbleVisible,
    sending,
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
    settings.inputCorner,
  ]);

  useEffect(() => {
    if (!ready) return;
    let unlistenUnlock: (() => void) | undefined;
    let unlistenLock: (() => void) | undefined;
    let cancelled = false;
    void subscribeUnlockPosition(() => {
      void setPositionLocked(false);
    }).then((fn) => {
      if (cancelled) {
        fn();
        return;
      }
      unlistenUnlock = fn;
    });
    void subscribePositionLocked((locked) => {
      void setPositionLocked(locked);
    }).then((fn) => {
      if (cancelled) {
        fn();
        return;
      }
      unlistenLock = fn;
    });
    return () => {
      cancelled = true;
      unlistenUnlock?.();
      unlistenLock?.();
    };
  }, [ready, setPositionLocked]);
}
