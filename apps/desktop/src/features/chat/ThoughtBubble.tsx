import { uiScale } from '../../lib/sticker';
import { useCompanionStore } from '../../stores/companion-store';

export function ThoughtBubble() {
  const messages = useCompanionStore((state) => state.messages);
  const sending = useCompanionStore((state) => state.sending);
  const settings = useCompanionStore((state) => state.settings);
  const lastAssistant = [...messages].reverse().find((item) => item.role === 'assistant');
  const scale = uiScale(settings.modelScale);
  const fontSize = Math.max(11, Math.round(12 * scale));
  const padX = Math.round(12 * scale);
  const padY = Math.round(8 * scale);
  const radius = Math.round(16 * scale);
  const maxWidth = Math.min(settings.dockWidth - 4, Math.round(200 * scale));

  if (!sending && !lastAssistant) return null;

  return (
    <div className="relative pl-3">
      <span
        className="absolute top-6 left-0 rounded-full bg-cream/90"
        style={{ width: 8 * scale, height: 8 * scale }}
      />
      <span
        className="absolute top-9 -left-0.5 rounded-full bg-cream/70"
        style={{ width: 5 * scale, height: 5 * scale }}
      />
      <div
        className="rounded-tl-md border border-cream/20 bg-cream text-ink shadow-lg"
        style={{
          maxWidth,
          padding: `${padY}px ${padX}px`,
          borderRadius: radius,
          borderTopLeftRadius: 6,
          fontSize,
          lineHeight: 1.4,
        }}
      >
        {sending && !lastAssistant ? (
          <span className="inline-flex gap-1 text-mute">
            <span className="animate-pulse">.</span>
            <span className="animate-pulse [animation-delay:120ms]">.</span>
            <span className="animate-pulse [animation-delay:240ms]">.</span>
          </span>
        ) : sending ? (
          <p className="text-ink/70">Thinking…</p>
        ) : (
          <p>{lastAssistant?.content}</p>
        )}
      </div>
    </div>
  );
}
