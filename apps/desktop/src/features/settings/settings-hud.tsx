import { DEFAULT_GEMINI_MODEL } from '@yuta/shared';
import { Badge, Button, Field, Input, Switch, Textarea } from '@yuta/ui';
import { Eye, EyeOff } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import {
  applyAlwaysOnTop,
  type SettingsHud,
  useCompanionStore,
} from '../../stores/companion-store';
import { RangeField } from './range-field';

const CROP_PRESETS = {
  full: { cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0 },
  bust: { cropTop: 0, cropBottom: 0.38, cropLeft: 0.04, cropRight: 0.04 },
  head: { cropTop: 0.02, cropBottom: 0.58, cropLeft: 0.12, cropRight: 0.12 },
} as const;

const GEMINI_MODELS = [DEFAULT_GEMINI_MODEL, 'gemini-2.5-pro'] as const;

const GLASS =
  'rounded-[28px] border border-white/12 bg-panel/80 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl';

export function SettingsHudPanel({ hud }: { hud: Exclude<SettingsHud, null> }) {
  if (hud === 'scale') return <ScaleHud />;
  if (hud === 'crop') return <CropHud />;
  if (hud === 'dock') return <DockHud />;
  if (hud === 'profile') return <ProfileHud />;
  return <AiHud />;
}

function ScaleHud() {
  const settings = useCompanionStore((state) => state.settings);
  const applyAppearance = useCompanionStore((state) => state.applyAppearance);
  return (
    <div className={GLASS}>
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-accent">Size</p>
      <RangeField
        label="Scale"
        min={0.5}
        max={2}
        step={0.05}
        suffix="x"
        value={settings.modelScale}
        onChange={(modelScale) => applyAppearance({ modelScale })}
      />
    </div>
  );
}

function CropHud() {
  const settings = useCompanionStore((state) => state.settings);
  const applyAppearance = useCompanionStore((state) => state.applyAppearance);
  return (
    <div className={GLASS}>
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-accent">Crop</p>
      <div className="mb-2 flex gap-1">
        {(
          [
            ['full', 'Full'],
            ['bust', 'Bust'],
            ['head', 'Head'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="h-7 flex-1 rounded-full border border-white/12 text-[11px] text-cream hover:bg-white/10"
            onClick={() => applyAppearance(CROP_PRESETS[id])}
          >
            {label}
          </button>
        ))}
      </div>
      <RangeField
        label="Bottom"
        min={0}
        max={0.7}
        step={0.01}
        value={settings.cropBottom}
        onChange={(cropBottom) => applyAppearance({ cropBottom })}
      />
      <RangeField
        label="Sides"
        min={0}
        max={0.45}
        step={0.01}
        value={Math.max(settings.cropLeft, settings.cropRight)}
        onChange={(value) => applyAppearance({ cropLeft: value, cropRight: value })}
      />
    </div>
  );
}

function DockHud() {
  const settings = useCompanionStore((state) => state.settings);
  const applyAppearance = useCompanionStore((state) => state.applyAppearance);
  return (
    <div className={GLASS}>
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-accent">Dock</p>
      <RangeField
        label="Width"
        min={180}
        max={420}
        step={4}
        suffix="px"
        value={settings.dockWidth}
        onChange={(dockWidth) => applyAppearance({ dockWidth })}
      />
      <RangeField
        label="Gap"
        min={0}
        max={24}
        step={1}
        suffix="px"
        value={settings.dockGap}
        onChange={(dockGap) => applyAppearance({ dockGap })}
      />
      <RangeField
        label="Height"
        min={0}
        max={0.55}
        step={0.01}
        value={settings.dockOffsetY}
        onChange={(dockOffsetY) => applyAppearance({ dockOffsetY })}
      />
    </div>
  );
}

function ProfileHud() {
  const settings = useCompanionStore((state) => state.settings);
  const save = useCompanionStore((state) => state.saveSettings);
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await save({
        ...useCompanionStore.getState().settings,
        companionName: draft.companionName,
        personality: draft.personality,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={GLASS} onSubmit={(event) => void onSubmit(event)}>
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-accent">Companion</p>
      <Field label="Name">
        <Input
          value={draft.companionName}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setDraft({ ...draft, companionName: event.target.value })
          }
        />
      </Field>
      <Field label="Personality">
        <Textarea
          className="min-h-16"
          value={draft.personality}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setDraft({ ...draft, personality: event.target.value })
          }
        />
      </Field>
      <Button type="submit" loading={saving} className="mt-2 h-8 w-full rounded-full">
        Save
      </Button>
    </form>
  );
}

function AiHud() {
  const settings = useCompanionStore((state) => state.settings);
  const provider = useCompanionStore((state) => state.provider);
  const save = useCompanionStore((state) => state.saveSettings);
  const applyAppearance = useCompanionStore((state) => state.applyAppearance);
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await save({
        ...useCompanionStore.getState().settings,
        geminiApiKey: draft.geminiApiKey,
        geminiModel: draft.geminiModel,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={GLASS} onSubmit={(event) => void onSubmit(event)}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-accent">AI</p>
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
            className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-mute hover:bg-white/10"
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
            onClick={() => setShowKey((value) => !value)}
          >
            {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <Field label="Model">
        <select
          value={draft.geminiModel}
          onChange={(event) => setDraft({ ...draft, geminiModel: event.target.value })}
          className="box-border h-10 w-full rounded-full border border-line bg-ink px-3 text-sm text-cream outline-none focus:border-accent"
        >
          {GEMINI_MODELS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </Field>
      <div className="mt-2 flex h-9 items-center justify-between rounded-full border border-white/10 px-3">
        <span className="text-xs">Always on top</span>
        <Switch
          checked={settings.alwaysOnTop}
          onCheckedChange={(value) => void applyAlwaysOnTop(value)}
        />
      </div>
      <div className="flex h-9 items-center justify-between rounded-full border border-white/10 px-3">
        <span className="text-xs">Look at cursor</span>
        <Switch
          checked={settings.followCursor}
          onCheckedChange={(followCursor) => applyAppearance({ followCursor })}
        />
      </div>
      <Button type="submit" loading={saving} className="mt-2 h-8 w-full rounded-full">
        Save
      </Button>
    </form>
  );
}
