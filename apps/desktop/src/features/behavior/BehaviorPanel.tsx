import { session } from '../../app/session';
import { useCompanionStore } from '../../stores/companion-store';

export function BehaviorPanel() {
  const summary = useCompanionStore((state) => state.behaviorSummary);
  const hint = session.behavior.getHint();
  const rows = session.behavior.snapshot().slice(-12).reverse();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl">Behavior</h2>
      <p className="rounded-2xl border border-line bg-panel p-4 text-sm">{summary || hint.summary}</p>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl border border-line p-3">
          <dt className="text-mute">Tone</dt>
          <dd>{hint.tone}</dd>
        </div>
        <div className="rounded-xl border border-line p-3">
          <dt className="text-mute">Verbosity</dt>
          <dd>{hint.verbosity}</dd>
        </div>
        <div className="rounded-xl border border-line p-3">
          <dt className="text-mute">Avoid</dt>
          <dd>{hint.avoid.join(', ') || 'none'}</dd>
        </div>
      </dl>
      <ul className="space-y-2 text-sm">
        {rows.map((row) => (
          <li key={`${row.at}-${row.role}`} className="rounded-xl border border-line bg-panel px-3 py-2">
            <span className="text-xs uppercase text-mute">{row.role}</span>
            <p className="truncate">{row.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
