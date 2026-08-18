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
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Memory</h3>
        <Button variant="outline" size="sm" onClick={() => void clear()}>
          Clear
        </Button>
      </div>
      <div className="space-y-2">
        {memories.length === 0 ? (
          <p className="text-xs text-mute">
            Nothing stored yet. Durable facts land here as markdown files.
          </p>
        ) : (
          memories.map((memory) => (
            <article key={memory.id} className="rounded-xl border border-line bg-ink/70 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Badge>{memory.category}</Badge>
                <span className="truncate text-[10px] text-mute">{memory.path}</span>
              </div>
              <h4 className="text-sm font-medium">{memory.title}</h4>
              <p className="mt-1 text-xs leading-5 text-cream/80">{memory.content}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
