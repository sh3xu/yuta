import { session } from '../../app/session';
import { useCompanionStore } from '../../stores/companion-store';

export function BehaviorPanel() {
  const summary = useCompanionStore((state) => state.behaviorSummary);
  const hint = session.behavior.getHint();
  const rows = session.behavior.snapshot().slice(-12).reverse();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Behavior</h3>
      <p className="rounded-xl border border-line bg-ink/70 p-3 text-xs leading-5">
        {summary || hint.summary}
      </p>
      <dl className="grid grid-cols-3 gap-1.5 text-xs">
        <div className="rounded-xl border border-line p-2">
          <dt className="text-mute">Tone</dt>
          <dd>{hint.tone}</dd>
        </div>
        <div className="rounded-xl border border-line p-2">
          <dt className="text-mute">Verbosity</dt>
          <dd>{hint.verbosity}</dd>
        </div>
        <div className="rounded-xl border border-line p-2">
          <dt className="text-mute">Avoid</dt>
          <dd className="truncate">{hint.avoid.join(', ') || 'none'}</dd>
        </div>
      </dl>
      <ul className="space-y-1.5 text-xs">
        {rows.map((row) => (
          <li
            key={`${row.at}-${row.role}`}
            className="rounded-xl border border-line bg-ink/70 px-2.5 py-2"
          >
            <span className="text-[10px] uppercase text-mute">{row.role}</span>
            <p className="truncate">{row.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
