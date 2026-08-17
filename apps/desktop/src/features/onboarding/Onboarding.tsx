import { Button, Field, Input, Textarea } from '@yuta/ui';
import { useState, type ChangeEvent } from 'react';
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
      await save({ ...draft, onboardingComplete: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/92 p-6">
      <div className="flex w-full max-w-lg flex-col gap-5 rounded-3xl border border-line bg-panel p-8 shadow-2xl">
        {step === 0 ? (
          <>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Yuta</p>
            <h1 className="font-display text-4xl">A companion that stays on your machine.</h1>
            <p className="text-mute">
              Chat, voice, Live2D, and local memory. Gemini is optional and uses your key only.
            </p>
            <Button className="self-start" onClick={next}>
              Continue
            </Button>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <h2 className="font-display text-3xl">Name them</h2>
            <div className="flex flex-col gap-4">
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
                  value={draft.personality}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    setDraft({ ...draft, personality: event.target.value })
                  }
                />
              </Field>
            </div>
            <Button className="self-start" onClick={next}>
              Continue
            </Button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <h2 className="font-display text-3xl">Gemini key</h2>
            <Field label="API key" hint="Leave empty to use the local mock provider. You can add a key later.">
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
    </div>
  );
}
