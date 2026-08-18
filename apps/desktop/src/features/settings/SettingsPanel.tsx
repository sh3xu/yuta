import { Button, Field, Input, Switch, Textarea, toast } from '@yuta/ui';
import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useCompanionStore } from '../../stores/companion-store';

export function SettingsPanel() {
  const settings = useCompanionStore((state) => state.settings);
  const save = useCompanionStore((state) => state.saveSettings);
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await save({ ...draft, onboardingComplete: true });
    } catch (error) {
      toast({
        variant: 'error',
        title: 'settings',
        description: error instanceof Error ? error.message : 'Could not save settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto">
      <form className="flex min-h-0 flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
        <h2 className="shrink-0 font-display text-xl">Settings</h2>
        <div className="flex min-w-0 flex-col gap-4">
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
          <Field
            label="Gemini API key"
            hint="Stored on this machine. Leave empty to use the mock provider."
          >
            <Input
              type="password"
              autoComplete="off"
              value={draft.geminiApiKey}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setDraft({ ...draft, geminiApiKey: event.target.value })
              }
            />
          </Field>
          <Field label="Gemini model">
            <Input
              value={draft.geminiModel}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setDraft({ ...draft, geminiModel: event.target.value })
              }
            />
          </Field>
          <div className="flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3">
            <span className="text-sm">Voice replies</span>
            <Switch
              checked={draft.voiceEnabled}
              onCheckedChange={(voiceEnabled) => setDraft({ ...draft, voiceEnabled })}
            />
          </div>
        </div>
        <div className="shrink-0 pt-2">
          <Button type="submit" loading={saving}>
            {saving ? 'Saving' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
