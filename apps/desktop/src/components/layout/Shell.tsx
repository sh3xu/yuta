import { toast } from '@yuta/ui';
import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CharacterStage } from '../../features/character/CharacterStage';
import { ChatDock } from '../../features/chat/ChatDock';
import { Onboarding } from '../../features/onboarding/Onboarding';
import { PlaceChip } from '../../features/placement/PlaceChip';
import { SettingsOrb } from '../../features/settings/settings-orb';
import { stickerMode, stickerSize, visibleStage, WINDOW_PAD } from '../../lib/sticker';
import { useStickerWindow } from '../../lib/use-sticker-window';
import { useCompanionStore } from '../../stores/companion-store';

export function Shell() {
  const settings = useCompanionStore((state) => state.settings);
  const composerOpen = useCompanionStore((state) => state.composerOpen);
  const settingsOpen = useCompanionStore((state) => state.settingsOpen);
  const bubbleVisible = useCompanionStore((state) => state.bubbleVisible);
  const closeOverlays = useCompanionStore((state) => state.closeOverlays);
  const setPositionLocked = useCompanionStore((state) => state.setPositionLocked);
  const [badgeHint, setBadgeHint] = useState(true);
  const [badgePulse, setBadgePulse] = useState(0);

  useStickerWindow();

  const mode = stickerMode({
    onboardingComplete: settings.onboardingComplete,
    positionLocked: settings.positionLocked,
    composerOpen,
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
    if (settingsOpen) {
      setBadgeHint(true);
      return;
    }
    setBadgeHint(true);
    const timer = window.setTimeout(() => setBadgeHint(false), 2000);
    return () => window.clearTimeout(timer);
  }, [settings.positionLocked, composerOpen, settingsOpen, badgePulse]);

  return (
    <div
      className="flex items-start overflow-visible bg-transparent p-2"
      style={{ width: size.width, height: size.height }}
    >
      <div className="relative z-30 flex shrink-0 flex-col gap-2">
        <div
          className="relative"
          onClickCapture={() => {
            setBadgeHint(true);
            setBadgePulse((value) => value + 1);
          }}
        >
          <CharacterStage />
          {settings.onboardingComplete && (badgeHint || settingsOpen) ? (
            <div className="absolute right-1 bottom-1 z-30 flex items-end gap-1">
              {settings.positionLocked ? (
                <button
                  type="button"
                  title="Unlock position"
                  aria-label="Unlock position"
                  className="inline-flex size-5 items-center justify-center rounded-full border border-white/20 bg-panel/85 text-cream shadow-[0_6px_16px_rgba(0,0,0,0.35)] backdrop-blur-md hover:border-accent/70"
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
              <SettingsOrb />
            </div>
          ) : null}
        </div>
        {showPlace ? <PlaceChip /> : null}
      </div>
      {showDock ? (
        <section
          className="relative z-20 flex min-h-0 min-w-0 flex-col overflow-visible"
          style={{
            width: Math.max(settings.dockWidth, settingsOpen ? 280 : settings.dockWidth),
            marginLeft: settings.dockGap,
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
