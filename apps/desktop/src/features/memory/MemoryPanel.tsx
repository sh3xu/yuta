import { Badge, Button } from '@yuta/ui';
import { useEffect } from 'react';
import { useCompanionStore } from '../../stores/companion-store';

export function MemoryPanel() {
  const memories = useCompanionStore((state) => state.memories);
  const refresh = useCompanionStore((state) => state.refreshMemories);
  const clear = useCompanionStore((state) => state.clearMemories);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Memory</h2>
        <Button variant="outline" size="sm" onClick={() => void clear()}>
          Clear
        </Button>
      </div>
      <div className="space-y-3 overflow-auto">
        {memories.length === 0 ? (
          <p className="text-sm text-mute">Nothing stored yet. Durable facts will land here as markdown files.</p>
        ) : (
          memories.map((memory) => (
            <article key={memory.id} className="rounded-2xl border border-line bg-panel p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge>{memory.category}</Badge>
                <span className="text-xs text-mute">{memory.path}</span>
              </div>
              <h3 className="text-sm font-medium">{memory.title}</h3>
              <p className="mt-1 text-sm text-cream/80">{memory.content}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
