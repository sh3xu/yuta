import { Button } from '@yuta/ui';
import { Mic } from 'lucide-react';
import { useState } from 'react';
import { session } from '../../app/session';
import { notifyError } from '../../lib/notify';
import { useCompanionStore } from '../../stores/companion-store';

export function ChatPanel() {
  const messages = useCompanionStore((state) => state.messages);
  const sending = useCompanionStore((state) => state.sending);
  const send = useCompanionStore((state) => state.send);
  const lastAssistant = [...messages].reverse().find((item) => item.role === 'assistant');
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);

  const submit = () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    void send(text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 rounded-2xl border border-line bg-ink px-4 py-3 text-sm leading-6 text-cream/90">
        {lastAssistant?.content ?? 'Say something. I will look at you while I answer.'}
      </div>
      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-auto pr-1 text-sm">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === 'user' ? 'text-right text-accent' : 'text-cream/85'}
          >
            <span className="text-[10px] uppercase tracking-wide text-mute">{message.role}</span>
            <p className="mt-0.5">{message.content}</p>
          </div>
        ))}
      </div>
      <form
        className="relative z-10 mt-3 grid shrink-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2"
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
          {listening ? null : <Mic className="size-4" />}
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
          placeholder="Type something..."
          className="box-border h-10 w-full min-w-0 rounded-lg border border-line bg-ink px-3 text-sm text-cream outline-none placeholder:text-mute focus:border-accent disabled:opacity-60"
        />
        <Button type="submit" loading={sending} disabled={!draft.trim() && !sending}>
          Send
        </Button>
      </form>
    </div>
  );
}
