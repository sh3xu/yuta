import { DEFAULT_GEMINI_MODEL } from '@yuta/shared';
import { Badge, Field, Input, Switch } from '@yuta/ui';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';
import type { AppSettings } from '../../lib/settings';
import { useCompanionStore } from '../../stores/companion-store';
import { SectionCard } from './section-card';

const GEMINI_MODELS = [DEFAULT_GEMINI_MODEL, 'gemini-2.5-pro'] as const;

export function AiSection({
  draft,
  setDraft,
}: {
  draft: AppSettings;
  setDraft: (value: AppSettings) => void;
}) {
  const provider = useCompanionStore((state) => state.provider);
  const voiceEnabled = useCompanionStore((state) => state.settings.voiceEnabled);
  const patchSettings = useCompanionStore((state) => state.patchSettings);
  const [showKey, setShowKey] = useState(false);
  const knownModel = (GEMINI_MODELS as readonly string[]).includes(draft.geminiModel);
  const [customModel, setCustomModel] = useState(!knownModel);

  return (
    <div className="flex flex-col gap-3">
      <SectionCard
        title="Gemini"
        description="Your key stays on this machine. Empty uses the mock provider."
        icon={<Sparkles className="size-4" />}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-mute">Provider</span>
          <Badge>{provider}</Badge>
        </div>
        <Field label="API key">
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              className="pr-10"
              placeholder="AIza..."
              value={draft.geminiApiKey}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setDraft({ ...draft, geminiApiKey: event.target.value })
              }
            />
            <button
              type="button"
              className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-mute hover:bg-white/10 hover:text-cream"
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
              onClick={() => setShowKey((value) => !value)}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Field label="Model">
          <select
            value={customModel ? 'custom' : draft.geminiModel}
            onChange={(event) => {
              const value = event.target.value;
              if (value === 'custom') {
                setCustomModel(true);
                return;
              }
              setCustomModel(false);
              setDraft({ ...draft, geminiModel: value });
            }}
            className="box-border h-10 w-full rounded-lg border border-line bg-ink px-3 text-sm text-cream outline-none focus:border-accent"
          >
            {GEMINI_MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </Field>
        {customModel ? (
          <Field label="Custom model id">
            <Input
              value={draft.geminiModel}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setDraft({ ...draft, geminiModel: event.target.value })
              }
            />
          </Field>
        ) : null}
      </SectionCard>
      <SectionCard title="Voice" description="Spoken replies use the system voice.">
        <div className="flex h-10 items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3">
          <span className="text-sm">Voice replies</span>
          <Switch
            checked={voiceEnabled}
            onCheckedChange={(value) => {
              setDraft({ ...draft, voiceEnabled: value });
              void patchSettings({ voiceEnabled: value }, { silent: true });
            }}
          />
        </div>
      </SectionCard>
    </div>
  );
}
