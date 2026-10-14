import { useEffect } from 'react';
import { CharacterStage } from '../../features/character/CharacterStage';
import { ChatDock } from '../../features/chat/ChatDock';
import { Onboarding } from '../../features/onboarding/Onboarding';
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

  useStickerWindow();

  const mode = stickerMode({
    onboardingComplete: settings.onboardingComplete,
    composerOpen,
    bubbleVisible,
    sending,
  });
  const size = stickerSize(mode, settings);
  const showDock = mode !== 'collapsed' && mode !== 'place';
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

  return (
    <div className="pointer-events-none relative bg-transparent" style={{ width: size.width, height: size.height }}>
      <div
        className="pointer-events-none absolute z-10"
        style={{ left: characterLeft, top: WINDOW_PAD }}
      >
        <CharacterStage />
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
