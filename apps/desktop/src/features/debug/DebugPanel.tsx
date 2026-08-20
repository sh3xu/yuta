import { Badge } from '@yuta/ui';
import { useCompanionStore } from '../../stores/companion-store';

export function DebugPanel() {
  const characterState = useCompanionStore((state) => state.characterState);
  const provider = useCompanionStore((state) => state.provider);
  const lookupHits = useCompanionStore((state) => state.lookupHits);
  const behavior = useCompanionStore((state) => state.behaviorSummary);
  const lastError = useCompanionStore((state) => state.lastError);
  const plannedAction = useCompanionStore((state) => state.plannedAction);
  const llmAction = useCompanionStore((state) => state.llmAction);
  const playedAction = useCompanionStore((state) => state.playedAction);

  return (
    <div className="space-y-3 font-mono text-[11px]">
      <h3 className="font-sans text-sm font-medium">Debug</h3>
      <div className="grid grid-cols-2 gap-1.5">
        <Row label="Emotion" value={characterState.emotion} />
        <Row label="Intensity" value={characterState.emotionIntensity.toFixed(2)} />
        <Row label="Action" value={characterState.action ?? 'none'} />
        <Row label="Planned" value={plannedAction ?? 'none'} />
        <Row label="LLM action" value={llmAction ?? 'none'} />
        <Row label="Played" value={playedAction ?? characterState.action ?? 'none'} />
        <Row label="Speaking" value={String(characterState.speaking)} />
        <Row label="Mouth" value={characterState.mouthOpen.toFixed(2)} />
        <Row label="Dancing" value={String(characterState.dancing)} />
        <Row label="Dance move" value={characterState.danceMove ?? 'none'} />
        <Row label="System audio" value={characterState.musicEnergy.toFixed(2)} />
        <Row
          label="BPM"
          value={characterState.musicBpm ? characterState.musicBpm.toFixed(0) : '0'}
        />
        <Row label="LLM" value={provider} />
      </div>
      {lastError ? (
        <div className="space-y-1 rounded-xl border border-rose-400/40 bg-rose-950/40 px-3 py-2 text-rose-100">
          <div className="text-mute">Last error</div>
          <div>source: {lastError.source}</div>
          <div>{lastError.message}</div>
          {lastError.detail ? (
            <pre className="whitespace-pre-wrap text-[10px] text-rose-200/80">
              {lastError.detail}
            </pre>
          ) : null}
        </div>
      ) : (
        <p className="text-mute">No error this session.</p>
      )}
      <div>
        <p className="mb-1.5 text-mute">This-turn lookups</p>
        <div className="flex flex-wrap gap-1.5">
          {lookupHits.length === 0 ? <span className="text-mute">none</span> : null}
          {lookupHits.map((memory) => (
            <Badge key={memory.id}>{memory.path}</Badge>
          ))}
        </div>
      </div>
      <p className="font-sans text-xs text-cream/80">{behavior || 'No behavior summary yet.'}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/70 px-2.5 py-1.5">
      <div className="text-mute">{label}</div>
      <div className="uppercase text-accent">{value}</div>
    </div>
  );
}
