import { Toaster } from '@yuta/ui';
import { useEffect } from 'react';
import { Onboarding } from '../features/onboarding/Onboarding';
import { Shell } from '../components/layout/Shell';
import { useCompanionStore } from '../stores/companion-store';

export function App() {
  const ready = useCompanionStore((state) => state.ready);
  const onboardingComplete = useCompanionStore((state) => state.settings.onboardingComplete);
  const init = useCompanionStore((state) => state.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (!ready) {
    return <div className="grid h-full place-items-center text-mute">Opening Yuta…</div>;
  }

  return (
    <>
      <Shell />
      {onboardingComplete ? null : <Onboarding />}
      <Toaster />
    </>
  );
}
