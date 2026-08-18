import { toast } from '@yuta/ui';
import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CharacterStage } from '../../features/character/CharacterStage';
import { ChatDock } from '../../features/chat/ChatDock';
import { Onboarding } from '../../features/onboarding/Onboarding';
import { PlaceChip } from '../../features/placement/PlaceChip';
import { stickerMode, stickerSize, visibleStage, WINDOW_PAD } from '../../lib/sticker';
import { useStickerWindow } from '../../lib/use-sticker-window';
import { useCompanionStore } from '../../stores/companion-store';

export function Shell() {
  const settings = useCompanionStore((state) => state.settings);
  const chatOpen = useCompanionStore((state) => state.chatOpen);
  const settingsOpen = useCompanionStore((state) => state.settingsOpen);
  const bubbleVisible = useCompanionStore((state) => state.bubbleVisible);
  const closeOverlays = useCompanionStore((state) => state.closeOverlays);
  const setPositionLocked = useCompanionStore((state) => state.setPositionLocked);
  const [lockHint, setLockHint] = useState(true);
  const [lockPulse, setLockPulse] = useState(0);

  useStickerWindow();

  const mode = stickerMode({
    onboardingComplete: settings.onboardingComplete,
    positionLocked: settings.positionLocked,
    chatOpen,
    settingsOpen,
    bubbleVisible,
  });
  const size = stickerSize(mode, settings);
  const stage = visibleStage(settings);
  const showDock = mode !== 'collapsed' && mode !== 'place';
  const showPlace = mode === 'place';
  const dockTop = Math.round(stage.height * settings.dockOffsetY);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOverlays();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeOverlays]);

  useEffect(() => {
    if (!settings.positionLocked) {
      setLockHint(false);
      return;
    }
    setLockHint(true);
    const timer = window.setTimeout(() => setLockHint(false), 2000);
    return () => window.clearTimeout(timer);
  }, [settings.positionLocked, chatOpen, lockPulse]);

  return (
    <div
      className="flex items-start overflow-visible bg-transparent p-2"
      style={{ width: size.width, height: size.height, gap: settings.dockGap }}
    >
      <div className="relative z-0 flex shrink-0 flex-col gap-2">
        <div
          className="relative"
          onClickCapture={() => {
            if (settings.positionLocked) {
              setLockHint(true);
              setLockPulse((value) => value + 1);
            }
          }}
        >
          <CharacterStage />
          {settings.positionLocked && lockHint ? (
            <button
              type="button"
              title="Unlock position"
              aria-label="Unlock position"
              className="absolute right-1 bottom-1 z-20 inline-flex size-5 items-center justify-center rounded-full border border-white/20 bg-panel/85 text-cream shadow-[0_6px_16px_rgba(0,0,0,0.35)] backdrop-blur-md hover:border-accent/70"
              onClick={(event) => {
                event.stopPropagation();
                void setPositionLocked(false);
                toast({
                  variant: 'info',
                  title: 'unlocked',
                  description: 'Drag the companion, then tap the lock in settings to place.',
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
          className="relative z-20 flex min-h-0 min-w-0 flex-col overflow-visible"
          style={{
            width: Math.max(settings.dockWidth, settingsOpen ? 280 : settings.dockWidth),
            marginTop: dockTop,
            height: Math.max(220, size.height - WINDOW_PAD * 2 - dockTop),
          }}
        >
          {settings.onboardingComplete ? null : <Onboarding />}
          {settings.onboardingComplete ? <ChatDock /> : null}
        </section>
      ) : null}
    </div>
  );
}
