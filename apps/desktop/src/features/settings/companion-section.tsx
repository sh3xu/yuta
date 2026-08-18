import { Field, Input, Textarea } from '@yuta/ui';
import { UserRound } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { AppSettings } from '../../lib/settings';
import { SectionCard } from './section-card';

export function CompanionSection({
  draft,
  setDraft,
}: {
  draft: AppSettings;
  setDraft: (value: AppSettings) => void;
}) {
  return (
    <SectionCard
      title="Companion"
      description="Who they are on this machine."
      icon={<UserRound className="size-4" />}
    >
      <Field label="Name">
        <Input
          value={draft.companionName}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setDraft({ ...draft, companionName: event.target.value })
          }
        />
      </Field>
      <Field label="Personality" hint="Tone, quirks, and how they talk to you.">
        <Textarea
          className="min-h-20"
          value={draft.personality}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setDraft({ ...draft, personality: event.target.value })
          }
        />
      </Field>
    </SectionCard>
  );
}
