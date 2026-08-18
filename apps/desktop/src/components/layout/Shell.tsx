import { toast } from '@yuta/ui';
import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CharacterStage } from '../../features/character/CharacterStage';
import { ChatDock } from '../../features/chat/ChatDock';
import { Onboarding } from '../../features/onboarding/Onboarding';
import { PlaceChip } from '../../features/placement/PlaceChip';
import { isInputLeft, isInputTop, stickerMode, stickerSize, WINDOW_PAD } from '../../lib/sticker';
import { useStickerWindow } from '../../lib/use-sticker-window';
import { useCompanionStore } from '../../stores/companion-store';

export function Shell() {
  const settings = useCompanionStore((state) => state.settings);
  const composerOpen = useCompanionStore((state) => state.composerOpen);
  const bubbleVisible = useCompanionStore((state) => state.bubbleVisible);
  const sending = useCompanionStore((state) => state.sending);
  const closeOverlays = useCompanionStore((state) => state.closeOverlays);
  const setPositionLocked = useCompanionStore((state) => state.setPositionLocked);
  const [badgeHint, setBadgeHint] = useState(true);
  const [badgePulse, setBadgePulse] = useState(0);

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
  const showPlace = mode === 'place';
  const dockLeft = isInputLeft(settings.inputCorner);
  const dockTop = isInputTop(settings.inputCorner);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOverlays();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeOverlays]);

  useEffect(() => {
    if (!settings.positionLocked) {
      setBadgeHint(false);
      return;
    }
    setBadgeHint(true);
    const timer = window.setTimeout(() => setBadgeHint(false), 2000);
    return () => window.clearTimeout(timer);
  }, [settings.positionLocked, composerOpen, badgePulse]);

  return (
    <div
      className="flex overflow-visible bg-transparent p-2"
      style={{
        width: size.width,
        height: size.height,
        flexDirection: dockLeft ? 'row-reverse' : 'row',
        alignItems: dockTop ? 'flex-start' : 'flex-end',
      }}
    >
      <div className="relative z-10 flex shrink-0 flex-col gap-2">
        <div
          className="relative"
          onClickCapture={() => {
            if (settings.positionLocked) {
              setBadgeHint(true);
              setBadgePulse((value) => value + 1);
            }
          }}
        >
          <CharacterStage />
          {settings.onboardingComplete && settings.positionLocked && badgeHint ? (
            <button
              type="button"
              title="Unlock position"
              aria-label="Unlock position"
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
        </div>
        {showPlace ? <PlaceChip /> : null}
      </div>
      {showDock ? (
        <section
          className="relative z-30 flex min-h-0 min-w-0 flex-col overflow-visible"
          style={{
            width: settings.dockWidth,
            [dockLeft ? 'marginRight' : 'marginLeft']: settings.dockGap,
            height: Math.max(120, size.height - WINDOW_PAD * 2),
            justifyContent: dockTop ? 'flex-start' : 'flex-end',
          }}
        >
          {settings.onboardingComplete ? null : <Onboarding />}
          {settings.onboardingComplete ? <ChatDock /> : null}
        </section>
      ) : null}
    </div>
  );
}
