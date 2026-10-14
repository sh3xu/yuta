import { Toaster } from '@yuta/ui';
import { useEffect, useState } from 'react';
import { Shell } from '../components/layout/Shell';
import { TraySettings } from '../features/settings/tray-settings';
import { isTauri } from '../lib/tauri-fs';
import { currentWindowLabel, subscribeSettingsChanged } from '../lib/window';
import { useCompanionStore } from '../stores/companion-store';
import { session } from './session';

export function App() {
  const ready = useCompanionStore((state) => state.ready);
  const init = useCompanionStore((state) => state.init);
  const settingsOpen = useCompanionStore((state) => state.settingsOpen);
  const closeOverlays = useCompanionStore((state) => state.closeOverlays);
  const [surface, setSurface] = useState<'sticker' | 'settings'>('sticker');

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    void currentWindowLabel().then((label) => {
      setSurface(label === 'settings' ? 'settings' : 'sticker');
    });
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    void subscribeSettingsChanged((settings) => {
      session.configure(settings);
      useCompanionStore.setState({ settings, provider: session.debug.provider });
    }).then((fn) => {
      if (cancelled) {
        fn();
        return;
      }
      unlisten = fn;
    });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  if (!ready) {
    return (
      <div className="grid h-full w-full place-items-center text-sm text-mute">Opening Yuta…</div>
    );
  }

  if (surface === 'settings') {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-ink">
        <TraySettings />
        <Toaster />
      </div>
    );
  }

  return (
    <>
      <Shell />
      {!isTauri() && settingsOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-ink/95">
          <TraySettings onClose={closeOverlays} />
        </div>
      ) : null}
    </>
  );
}
