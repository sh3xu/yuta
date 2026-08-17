import { CharacterStage } from '../../features/character/CharacterStage';
import { ChatPanel } from '../../features/chat/ChatPanel';
import { MemoryPanel } from '../../features/memory/MemoryPanel';
import { BehaviorPanel } from '../../features/behavior/BehaviorPanel';
import { SettingsPanel } from '../../features/settings/SettingsPanel';
import { DebugPanel } from '../../features/debug/DebugPanel';
import { useCompanionStore } from '../../stores/companion-store';
import { Rail } from './Rail';

export function Shell() {
  const screen = useCompanionStore((state) => state.screen);

  return (
    <div className="flex h-full overflow-hidden bg-ink">
      <Rail />
      <main className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1.3fr)_minmax(340px,0.9fr)] gap-4 overflow-hidden p-4">
        <CharacterStage />
        <section className="relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-line bg-panel p-5">
          {screen === 'chat' ? <ChatPanel /> : null}
          {screen === 'memory' ? <MemoryPanel /> : null}
          {screen === 'behavior' ? <BehaviorPanel /> : null}
          {screen === 'settings' ? <SettingsPanel /> : null}
          {screen === 'debug' ? <DebugPanel /> : null}
        </section>
      </main>
    </div>
  );
}
