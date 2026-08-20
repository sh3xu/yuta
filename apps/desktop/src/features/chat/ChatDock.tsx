import { cn } from '@yuta/ui';
import { useCompanionStore } from '../../stores/companion-store';
import { Composer } from './Composer';
import { ThoughtBubble } from './ThoughtBubble';

export function ChatDock({ className }: { className?: string }) {
  const composerOpen = useCompanionStore((state) => state.composerOpen);
  const bubbleVisible = useCompanionStore((state) => state.bubbleVisible);
  const sending = useCompanionStore((state) => state.sending);
  const showBubble = bubbleVisible || sending;
  const showComposer = composerOpen;

  if (!showBubble && !showComposer) return null;

  return (
    <div data-yuta-hit="ui" className={cn('flex min-h-0 flex-col gap-1.5 overflow-visible', className)}>
      {showBubble ? <ThoughtBubble /> : null}
      {showComposer ? <Composer /> : null}
    </div>
  );
}
