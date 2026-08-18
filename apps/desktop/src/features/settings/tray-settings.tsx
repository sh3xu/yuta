import { Button } from '@yuta/ui';
import { type FormEvent, useEffect, useState } from 'react';
import { isTauri } from '../../lib/tauri-fs';
import { hideSettingsWindow } from '../../lib/window';
import { useCompanionStore } from '../../stores/companion-store';
import { AiSection } from './ai-section';
import { CompanionSection } from './companion-section';
import { DesktopSection } from './desktop-section';

export function TraySettings({ onClose }: { onClose?: () => void }) {
  const settings = useCompanionStore((state) => state.settings);
  const save = useCompanionStore((state) => state.saveSettings);
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    document.documentElement.style.background = '#12151c';
    document.body.style.background = '#12151c';
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      if (win.label !== 'settings') return;
      const fn = await win.onCloseRequested(async (event) => {
        event.preventDefault();
        await hideSettingsWindow();
      });
      if (cancelled) {
        fn();
        return;
      }
      unlisten = fn;
    })();
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await save({
        ...useCompanionStore.getState().settings,
        companionName: draft.companionName,
        personality: draft.personality,
        geminiApiKey: draft.geminiApiKey,
        geminiModel: draft.geminiModel,
        voiceEnabled: draft.voiceEnabled,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-3 overflow-auto bg-ink p-4 text-cream">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-accent">Yuta</p>
        <h1 className="font-display text-2xl">Settings</h1>
        <p className="text-sm text-mute">Size, crop, input, companion, and AI stay here.</p>
      </div>
      <DesktopSection />
      <form className="flex flex-col gap-3" onSubmit={(event) => void onSubmit(event)}>
        <CompanionSection draft={draft} setDraft={setDraft} />
        <AiSection draft={draft} setDraft={setDraft} />
        <Button type="submit" loading={saving} className="h-9 w-full rounded-full">
          Save companion and AI
        </Button>
      </form>
      {onClose ? (
        <Button type="button" variant="outline" className="h-9 w-full rounded-full" onClick={onClose}>
          Close
        </Button>
      ) : null}
    </div>
  );
}
