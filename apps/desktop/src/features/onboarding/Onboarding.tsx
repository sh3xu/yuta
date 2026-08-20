import { Button, Field, Input, Textarea } from '@yuta/ui';
import { type ChangeEvent, useState } from 'react';
import { useCompanionStore } from '../../stores/companion-store';

export function Onboarding() {
  const settings = useCompanionStore((state) => state.settings);
  const save = useCompanionStore((state) => state.saveSettings);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  const next = () => setStep((value) => value + 1);
  const finish = async () => {
    setSaving(true);
    try {
      await save({ ...draft, onboardingComplete: true, positionLocked: false }, { silent: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-yuta-hit="ui"
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto rounded-[22px] border border-line bg-panel/95 p-4"
    >
      {step === 0 ? (
        <>
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Yuta</p>
          <h1 className="font-display text-2xl leading-7">A sticker that stays on your desktop.</h1>
          <p className="text-sm text-mute">
            Click the companion to talk. Place them once, then they stay put.
          </p>
          <Button className="self-start" onClick={next}>
            Continue
          </Button>
        </>
      ) : null}
      {step === 1 ? (
        <>
          <h2 className="font-display text-xl">Name them</h2>
          <Field label="Companion name">
            <Input
              value={draft.companionName}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setDraft({ ...draft, companionName: event.target.value })
              }
            />
          </Field>
          <Field label="Personality">
            <Textarea
              className="min-h-20"
              value={draft.personality}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setDraft({ ...draft, personality: event.target.value })
              }
            />
          </Field>
          <Button className="self-start" onClick={next}>
            Continue
          </Button>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <h2 className="font-display text-xl">Gemini key</h2>
          <Field label="API key" hint="Leave empty to use the local mock provider.">
            <Input
              type="password"
              autoComplete="off"
              placeholder="AIza..."
              value={draft.geminiApiKey}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setDraft({ ...draft, geminiApiKey: event.target.value })
              }
            />
          </Field>
          <div className="flex gap-2">
            <Button variant="outline" loading={saving} onClick={() => void finish()}>
              Skip
            </Button>
            <Button loading={saving} onClick={() => void finish()}>
              {saving ? 'Saving' : 'Done'}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
