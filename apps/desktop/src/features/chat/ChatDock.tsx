import { cn } from '@yuta/ui';
import { useCompanionStore } from '../../stores/companion-store';
import { ThoughtBubble } from './ThoughtBubble';

export function ChatDock({ className }: { className?: string }) {
  const bubbleVisible = useCompanionStore((state) => state.bubbleVisible);
  const sending = useCompanionStore((state) => state.sending);
  const showBubble = bubbleVisible || sending;

  if (!showBubble) return null;

  return (
    <div
      data-yuta-hit="ui"
      className={cn('flex min-h-0 flex-col gap-1.5 overflow-visible', className)}
    >
      {showBubble ? <ThoughtBubble /> : null}
      {/* NOTE: text input stays closed. She talks on her own.
      {composerOpen ? <Composer /> : null}
      */}
    </div>
  );
}
