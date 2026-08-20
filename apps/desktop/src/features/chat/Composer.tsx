import { Button } from '@yuta/ui';
import { Mic, Send } from 'lucide-react';
import { useState } from 'react';
import { session } from '../../app/session';
import { notifyError } from '../../lib/notify';
import { uiScale } from '../../lib/sticker';
import { useCompanionStore } from '../../stores/companion-store';

export function Composer() {
  const sending = useCompanionStore((state) => state.sending);
  const send = useCompanionStore((state) => state.send);
  const modelScale = useCompanionStore((state) => state.settings.modelScale);
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const scale = uiScale(modelScale);
  const control = Math.round(32 * scale);
  const icon = Math.round(14 * scale);
  const fontSize = Math.max(11, Math.round(12 * scale));

  const submit = () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    void send(text);
  };

  return (
    <form
      data-yuta-hit="ui"
      className="grid items-center gap-1"
      style={{ gridTemplateColumns: `${control}px minmax(0, 1fr) ${control}px` }}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Button
        type="button"
        variant={listening ? 'default' : 'outline'}
        size="icon"
        loading={listening}
        className="shrink-0"
        style={{ width: control, height: control }}
        aria-label="Voice input"
        onClick={() => {
          setListening(true);
          session.listen(
            (text, isFinal) => {
              setDraft(text);
              if (isFinal) {
                setListening(false);
                setDraft('');
                void send(text);
              }
            },
            (message) => {
              setListening(false);
              notifyError({ source: 'stt', message });
              useCompanionStore.setState({ lastError: { source: 'stt', message } });
            },
          );
        }}
      >
        {listening ? null : <Mic style={{ width: icon, height: icon }} />}
      </Button>
      <input
        value={draft}
        disabled={sending}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder="Say something..."
        className="box-border w-full min-w-0 rounded-full border border-line bg-panel/95 px-3 text-cream outline-none placeholder:text-mute focus:border-accent disabled:opacity-60"
        style={{ height: control, fontSize }}
      />
      <Button
        type="submit"
        size="icon"
        className="shrink-0"
        style={{ width: control, height: control }}
        loading={sending}
        disabled={!draft.trim() && !sending}
        aria-label="Send"
      >
        {sending ? null : <Send style={{ width: icon, height: icon }} />}
      </Button>
    </form>
  );
}
