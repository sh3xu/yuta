import { toast } from '@yuta/ui';
import {
  Lock,
  LockOpen,
  Minimize2,
  PanelRight,
  Power,
  Scaling,
  Settings2,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { type SettingsHud, useCompanionStore } from '../../stores/companion-store';
import { SettingsHudPanel } from './settings-hud';

const CIRCLE =
  'inline-flex items-center justify-center rounded-full border border-white/15 bg-panel/80 text-cream shadow-[0_10px_28px_rgba(0,0,0,0.38)] backdrop-blur-md transition-all duration-300';

const HUB = 20;
const SAT = 28;
const RADIUS = 92;
const ICON = 12;

export function SettingsOrb() {
  const settings = useCompanionStore((state) => state.settings);
  const settingsOpen = useCompanionStore((state) => state.settingsOpen);
  const hud = useCompanionStore((state) => state.settingsHud);
  const openSettings = useCompanionStore((state) => state.openSettings);
  const setSettingsHud = useCompanionStore((state) => state.setSettingsHud);
  const setPositionLocked = useCompanionStore((state) => state.setPositionLocked);
  const quit = useCompanionStore((state) => state.quit);

  const items: Array<{
    id: string;
    label: string;
    active?: boolean;
    onClick: () => void;
    icon: typeof Settings2;
  }> = [
    {
      id: 'lock',
      label: settings.positionLocked ? 'Unlock position' : 'Lock position',
      active: settings.positionLocked,
      icon: settings.positionLocked ? Lock : LockOpen,
      onClick: () => {
        const next = !useCompanionStore.getState().settings.positionLocked;
        void setPositionLocked(next);
        toast({
          variant: 'info',
          title: next ? 'locked' : 'unlocked',
          description: next
            ? 'Position locked. Click the companion to show unlock.'
            : 'Drag the companion, then tap the lock to place.',
        });
      },
    },
    {
      id: 'scale',
      label: 'Size',
      active: hud === 'scale',
      icon: Scaling,
      onClick: () => toggleHud('scale'),
    },
    {
      id: 'crop',
      label: 'Crop',
      active: hud === 'crop',
      icon: Minimize2,
      onClick: () => toggleHud('crop'),
    },
    {
      id: 'dock',
      label: 'Dock',
      active: hud === 'dock',
      icon: PanelRight,
      onClick: () => toggleHud('dock'),
    },
    {
      id: 'profile',
      label: 'Companion',
      active: hud === 'profile',
      icon: UserRound,
      onClick: () => toggleHud('profile'),
    },
    {
      id: 'ai',
      label: 'AI',
      active: hud === 'ai',
      icon: Sparkles,
      onClick: () => toggleHud('ai'),
    },
    {
      id: 'quit',
      label: 'Quit',
      icon: Power,
      onClick: () => void quit(),
    },
  ];

  function toggleHud(next: Exclude<SettingsHud, null>) {
    setSettingsHud(hud === next ? null : next);
  }

  const cx = HUB / 2;
  const cy = HUB / 2;

  return (
    <div className="relative z-30" style={{ width: HUB, height: HUB }}>
      {settingsOpen
        ? items.map((item, index) => {
            const Icon = item.icon;
            const start = (-88 * Math.PI) / 180;
            const end = (-8 * Math.PI) / 180;
            const t = items.length === 1 ? 0.5 : index / (items.length - 1);
            const angle = start + (end - start) * t;
            const x = Math.cos(angle) * RADIUS;
            const y = Math.sin(angle) * RADIUS;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                className={`${CIRCLE} absolute z-30 hover:scale-105 hover:border-accent/70`}
                style={{
                  width: SAT,
                  height: SAT,
                  left: cx + x - SAT / 2,
                  top: cy + y - SAT / 2,
                  background: item.active ? 'rgba(232, 184, 109, 0.92)' : undefined,
                  color: item.active ? '#12151c' : undefined,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  item.onClick();
                }}
              >
                <Icon style={{ width: ICON, height: ICON }} />
              </button>
            );
          })
        : null}
      <button
        type="button"
        aria-label={settingsOpen ? 'Close settings' : 'Settings'}
        title={settingsOpen ? 'Close settings' : 'Settings'}
        className={`${CIRCLE} absolute left-0 top-0 z-40 hover:border-accent/80`}
        style={{
          width: HUB,
          height: HUB,
          transform: settingsOpen ? 'rotate(45deg)' : undefined,
          background: settingsOpen ? 'rgba(232, 184, 109, 0.95)' : undefined,
          color: settingsOpen ? '#12151c' : undefined,
        }}
        onClick={(event) => {
          event.stopPropagation();
          openSettings();
        }}
      >
        <Settings2 style={{ width: 12, height: 12 }} />
      </button>
      {settingsOpen && hud ? (
        <div className="absolute bottom-0 left-full z-40 ml-2 min-w-[220px]">
          <SettingsHudPanel hud={hud} />
        </div>
      ) : null}
    </div>
  );
}
