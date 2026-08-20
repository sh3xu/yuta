import { toast } from '@yuta/ui';
import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CharacterStage } from '../../features/character/CharacterStage';
import { ChatDock } from '../../features/chat/ChatDock';
import { Onboarding } from '../../features/onboarding/Onboarding';
import { PlaceChip } from '../../features/placement/PlaceChip';
import {
  characterInsetX,
  dockInsetX,
  isInputTop,
  stickerMode,
  stickerSize,
  WINDOW_PAD,
} from '../../lib/sticker';
import { useStickerWindow } from '../../lib/use-sticker-window';
import { useCompanionStore } from '../../stores/companion-store';

export function Shell() {
  const settings = useCompanionStore((state) => state.settings);
  const composerOpen = useCompanionStore((state) => state.composerOpen);
  const bubbleVisible = useCompanionStore((state) => state.bubbleVisible);
  const sending = useCompanionStore((state) => state.sending);
  const closeOverlays = useCompanionStore((state) => state.closeOverlays);
  const setPositionLocked = useCompanionStore((state) => state.setPositionLocked);
  const [chrome, setChrome] = useState(false);

  useStickerWindow();

  const mode = stickerMode({
    onboardingComplete: settings.onboardingComplete,
    positionLocked: settings.positionLocked,
    composerOpen,
    bubbleVisible,
    sending,
  });
  const size = stickerSize(mode, settings);
  const showDock = mode !== 'collapsed' && mode !== 'place';
  const showPlace = !settings.positionLocked && settings.onboardingComplete && chrome;
  const showLock = settings.onboardingComplete && settings.positionLocked && chrome;
  const dockTop = isInputTop(settings.inputCorner);
  const characterLeft = characterInsetX(mode, settings);
  const dockLeftPx = dockInsetX(mode, settings);
  const dockOffset = Math.round(settings.dockOffsetY);
  const dockMax = Math.max(48, size.height - WINDOW_PAD * 2 - 48);
  const dockY = Math.min(dockMax, Math.max(4, WINDOW_PAD + (dockTop ? dockOffset : -dockOffset)));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOverlays();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeOverlays]);

  useEffect(() => {
    if (!chrome || !settings.positionLocked) return;
    const timer = window.setTimeout(() => setChrome(false), 5000);
    return () => window.clearTimeout(timer);
  }, [chrome, settings.positionLocked]);

  return (
    <div className="pointer-events-none relative bg-transparent" style={{ width: size.width, height: size.height }}>
      <div
        className="pointer-events-none absolute z-10"
        style={{ left: characterLeft, top: WINDOW_PAD }}
      >
        <div className="relative">
          <CharacterStage onActivate={() => setChrome(true)} />
          {showLock ? (
            <button
              type="button"
              title="Unlock position"
              aria-label="Unlock position"
              data-yuta-hit="ui"
              className="absolute right-1 bottom-1 z-40 inline-flex size-5 items-center justify-center rounded-full border border-white/20 bg-panel/85 text-cream shadow-[0_6px_16px_rgba(0,0,0,0.35)] backdrop-blur-md hover:border-accent/70"
              onClick={(event) => {
                event.stopPropagation();
                void setPositionLocked(false);
                toast({
                  variant: 'info',
                  title: 'unlocked',
                  description: 'Drag the companion, then lock it from tray Settings.',
                });
              }}
            >
              <Lock className="size-2.5" />
            </button>
          ) : null}
          {showPlace ? (
            <div className="absolute inset-x-2 bottom-2 z-40">
              <PlaceChip />
            </div>
          ) : null}
        </div>
      </div>
      {showDock ? (
        <section
          className="pointer-events-none absolute z-30 flex w-max max-w-full flex-col"
          style={{
            left: dockLeftPx,
            ...(dockTop ? { top: dockY } : { bottom: dockY }),
            ...(mode === 'onboarding' ? { width: settings.dockWidth, height: size.height - WINDOW_PAD * 2 } : undefined),
          }}
        >
          {settings.onboardingComplete ? null : <Onboarding />}
          {settings.onboardingComplete ? (
            <div style={{ width: settings.dockWidth }}>
              <ChatDock />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
