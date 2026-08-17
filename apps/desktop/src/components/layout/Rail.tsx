import { Bug, MessageSquare, Settings2, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@yuta/ui';
import type { Screen } from '../../stores/companion-store';
import { useCompanionStore } from '../../stores/companion-store';

const ITEMS: Array<{ id: Screen; label: string; icon: typeof MessageSquare }> = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'memory', label: 'Memory', icon: Sparkles },
  { id: 'behavior', label: 'Behavior', icon: UserRound },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'debug', label: 'Debug', icon: Bug },
];

export function Rail() {
  const screen = useCompanionStore((state) => state.screen);
  const setScreen = useCompanionStore((state) => state.setScreen);
  const provider = useCompanionStore((state) => state.provider);

  return (
    <aside className="relative z-20 flex w-20 shrink-0 flex-col items-center gap-2 border-r border-line py-4">
      <div className="mb-2 font-display text-lg text-accent">Y</div>
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.id}
            variant={screen === item.id ? 'default' : 'outline'}
            size="icon"
            title={item.label}
            aria-label={item.label}
            onClick={() => setScreen(item.id)}
          >
            <Icon className="size-4" />
          </Button>
        );
      })}
      <div className="mt-auto px-1 text-center text-[10px] uppercase tracking-wide text-mute">{provider}</div>
    </aside>
  );
}
