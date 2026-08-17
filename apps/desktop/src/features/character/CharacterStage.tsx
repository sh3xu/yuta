import { Live2DRenderer } from '@yuta/character-engine';
import { useEffect, useRef } from 'react';
import { useCompanionStore } from '../../stores/companion-store';

const MODEL_URL = '/characters/hiyori/Hiyori.model3.json';

export function CharacterStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Live2DRenderer | null>(null);
  const characterState = useCompanionStore((state) => state.characterState);
  const companionName = useCompanionStore((state) => state.settings.companionName);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const renderer = new Live2DRenderer();
    rendererRef.current = renderer;
    void renderer.mount(host, MODEL_URL).catch((error: unknown) => {
      console.error('Live2D failed to load', error);
    });
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.applyState(characterState);
  }, [characterState]);

  return (
    <section className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-line bg-[radial-gradient(circle_at_50%_20%,#2a3146,transparent_55%),linear-gradient(180deg,#151925,#0e1118)]">
      <div ref={hostRef} className="relative h-full min-h-0 w-full overflow-hidden" />
      <p className="pointer-events-none absolute bottom-6 left-0 right-0 text-center font-display text-2xl text-cream/90">
        {companionName}
      </p>
    </section>
  );
}
