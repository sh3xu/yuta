import { cn } from '@yuta/ui';
import { useCompanionStore } from '../../stores/companion-store';
import { SettingsOrb } from '../settings/settings-orb';
import { Composer } from './Composer';
import { ThoughtBubble } from './ThoughtBubble';

export function ChatDock({ className }: { className?: string }) {
  const chatOpen = useCompanionStore((state) => state.chatOpen);
  const bubbleVisible = useCompanionStore((state) => state.bubbleVisible);
  const sending = useCompanionStore((state) => state.sending);
  const showBubble = sending || bubbleVisible;
  const showComposer = chatOpen;

  if (!showBubble && !showComposer) return null;

  return (
    <div className={cn('flex min-h-0 flex-col gap-1.5 overflow-visible', className)}>
      {showBubble ? <ThoughtBubble /> : null}
      {showComposer ? (
        <>
          <Composer />
          <SettingsOrb />
        </>
      ) : null}
    </div>
  );
}
