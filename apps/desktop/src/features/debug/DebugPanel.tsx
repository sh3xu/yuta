import { Badge } from '@yuta/ui';
import { useCompanionStore } from '../../stores/companion-store';

export function DebugPanel() {
  const characterState = useCompanionStore((state) => state.characterState);
  const provider = useCompanionStore((state) => state.provider);
  const memories = useCompanionStore((state) => state.memories);
  const behavior = useCompanionStore((state) => state.behaviorSummary);
  const lastError = useCompanionStore((state) => state.lastError);

  return (
    <div className="space-y-4 font-mono text-xs">
      <h2 className="font-display text-xl">Debug</h2>
      <div className="grid grid-cols-2 gap-2">
        <Row label="Emotion" value={characterState.emotion} />
        <Row label="Intensity" value={characterState.emotionIntensity.toFixed(2)} />
        <Row label="Action" value={characterState.action ?? 'none'} />
        <Row label="Speaking" value={String(characterState.speaking)} />
        <Row label="Mouth" value={characterState.mouthOpen.toFixed(2)} />
        <Row label="LLM" value={provider} />
      </div>
      {lastError ? (
        <div className="space-y-1 rounded-xl border border-rose-400/40 bg-rose-950/40 px-3 py-2 text-rose-100">
          <div className="text-mute">Last error</div>
          <div>source: {lastError.source}</div>
          <div>{lastError.message}</div>
          {lastError.detail ? <pre className="whitespace-pre-wrap text-[11px] text-rose-200/80">{lastError.detail}</pre> : null}
        </div>
      ) : (
        <p className="text-mute">No error this session.</p>
      )}
      <div>
        <p className="mb-2 text-mute">Loaded memories</p>
        <div className="flex flex-wrap gap-2">
          {memories.length === 0 ? <span className="text-mute">none</span> : null}
          {memories.map((memory) => (
            <Badge key={memory.id}>{memory.path}</Badge>
          ))}
        </div>
      </div>
      <p className="text-cream/80">{behavior || 'No behavior summary yet.'}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-3 py-2">
      <div className="text-mute">{label}</div>
      <div className="uppercase text-accent">{value}</div>
    </div>
  );
}
