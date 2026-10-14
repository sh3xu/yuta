import { useEffect, useRef } from 'react';
import { useCompanionStore } from '../stores/companion-store';
import { stickerMode, type StickerMode } from './sticker';
import type { AppSettings } from './settings';
import { restoreWindow, setStickerSize, subscribePositionLocked } from './window';

export function useStickerWindow(): void {
  const ready = useCompanionStore((state) => state.ready);
  const settings = useCompanionStore((state) => state.settings);
  const composerOpen = useCompanionStore((state) => state.composerOpen);
  const sending = useCompanionStore((state) => state.sending);
  const bubbleVisible = useCompanionStore((state) => state.bubbleVisible);
  const setPositionLocked = useCompanionStore((state) => state.setPositionLocked);
  const restored = useRef(false);
  const previous = useRef<{ mode: StickerMode; settings: AppSettings } | null>(null);
  const queue = useRef(Promise.resolve());

  const mode = stickerMode({
    onboardingComplete: settings.onboardingComplete,
    composerOpen,
    bubbleVisible,
    sending,
  });

  useEffect(() => {
    if (!ready) return;
    queue.current = queue.current
      .then(async () => {
        if (!restored.current) {
          restored.current = true;
          await restoreWindow(useCompanionStore.getState().settings);
        }
        const live = useCompanionStore.getState().settings;
        const from = previous.current;
        previous.current = { mode, settings: live };
        await setStickerSize(mode, live, from ?? undefined);
      })
      .catch((error: unknown) => {
        console.error('[yuta] sticker size', error);
      });
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
    settings.inputCorner,
  ]);

  useEffect(() => {
    if (!ready) return;
    let unlistenLock: (() => void) | undefined;
    let cancelled = false;
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
      unlistenLock?.();
    };
  }, [ready, setPositionLocked]);
}
