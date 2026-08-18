import { Toaster } from '@yuta/ui';
import { useEffect } from 'react';
import { Shell } from '../components/layout/Shell';
import { useCompanionStore } from '../stores/companion-store';

export function App() {
  const ready = useCompanionStore((state) => state.ready);
  const init = useCompanionStore((state) => state.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (!ready) {
    return (
      <div className="grid h-full w-full place-items-center text-sm text-mute">Opening Yuta…</div>
    );
  }

  return (
    <>
      <Shell />
      <Toaster />
    </>
  );
}
