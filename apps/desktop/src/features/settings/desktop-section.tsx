import { Toggle } from '@yuta/ui';
import { Minimize2, Pin, Scaling } from 'lucide-react';
import { isTauri } from '../../lib/tauri-fs';
import { requestPositionLocked } from '../../lib/window';
import { applyAlwaysOnTop, useCompanionStore } from '../../stores/companion-store';
import { RangeField } from './range-field';
import { SectionCard } from './section-card';

const CROP_PRESETS = {
  full: { cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0 },
  bust: { cropTop: 0, cropBottom: 0.38, cropLeft: 0.04, cropRight: 0.04 },
  head: { cropTop: 0.02, cropBottom: 0.58, cropLeft: 0.12, cropRight: 0.12 },
} as const;

export function DesktopSection() {
  const settings = useCompanionStore((state) => state.settings);
  const setPositionLocked = useCompanionStore((state) => state.setPositionLocked);
  const placeCompanion = useCompanionStore((state) => state.placeCompanion);
  const setLocked = async (locked: boolean) => {
    if (isTauri()) {
      useCompanionStore.setState({
        settings: { ...useCompanionStore.getState().settings, positionLocked: locked },
      });
      await requestPositionLocked(locked);
      return;
    }
    await setPositionLocked(locked);
  };
  const applyAppearance = useCompanionStore((state) => state.applyAppearance);

  return (
    <div className="flex shrink-0 flex-col gap-3">
      <SectionCard
        title="Placement"
        description="Unlock to drag her. Lock keeps her still and lets clicks pass through."
        icon={<Pin className="size-4" />}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={settings.positionLocked}
            className="h-9 rounded-lg border border-line bg-panel text-sm text-cream hover:bg-white/10 disabled:opacity-40"
            onClick={() => void setLocked(true)}
          >
            Lock
          </button>
          <button
            type="button"
            disabled={!settings.positionLocked}
            className="h-9 rounded-lg border border-line bg-panel text-sm text-cream hover:bg-white/10 disabled:opacity-40"
            onClick={() => void setLocked(false)}
          >
            Unlock
          </button>
        </div>
        <p className="text-[11px] leading-4 text-mute">
          {settings.positionLocked
            ? 'Locked. She cannot be dragged, and clicks pass through her.'
            : 'Unlocked. Drag her on the desktop, then press Lock.'}
        </p>
        <button
          type="button"
          className="h-9 rounded-lg border border-line bg-panel text-sm text-cream hover:bg-white/10 disabled:opacity-40"
          disabled={settings.positionLocked}
          onClick={(event) => void placeCompanion({ x: event.screenX, y: event.screenY })}
        >
          Place here
        </button>
        <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3 py-1.5">
          <span className="text-sm">Always on top</span>
          <Toggle
            checked={settings.alwaysOnTop}
            onCheckedChange={(value) => void applyAlwaysOnTop(value)}
          />
        </div>
        <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3 py-1.5">
          <span className="text-sm">Look at cursor</span>
          <Toggle
            checked={settings.followCursor}
            onCheckedChange={(followCursor) => applyAppearance({ followCursor })}
          />
        </div>
        <p className="text-[11px] leading-4 text-mute">
          Eyes and head follow the cursor across the whole desktop.
        </p>
      </SectionCard>

      <SectionCard
        title="Model size"
        description="Scale the companion. Crop cuts the window without shrinking the model."
        icon={<Scaling className="size-4" />}
      >
        <RangeField
          label="Scale"
          min={0.5}
          max={2}
          step={0.05}
          suffix="x"
          value={settings.modelScale}
          onChange={(modelScale) => applyAppearance({ modelScale })}
        />
      </SectionCard>

      <SectionCard
        title="Crop"
        description="Hide legs or sides so the sticker window is only the part you want."
        icon={<Minimize2 className="size-4" />}
      >
        <div className="flex flex-wrap gap-1">
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
              className="h-7 rounded-md border border-line px-2 text-[11px] text-cream hover:bg-white/10"
              onClick={() => applyAppearance(CROP_PRESETS[id])}
            >
              {label}
            </button>
          ))}
        </div>
        <RangeField
          label="Crop top"
          min={0}
          max={0.45}
          step={0.01}
          value={settings.cropTop}
          onChange={(cropTop) => applyAppearance({ cropTop })}
        />
        <RangeField
          label="Crop bottom"
          min={0}
          max={0.7}
          step={0.01}
          value={settings.cropBottom}
          onChange={(cropBottom) => applyAppearance({ cropBottom })}
        />
        <RangeField
          label="Crop left"
          min={0}
          max={0.45}
          step={0.01}
          value={settings.cropLeft}
          onChange={(cropLeft) => applyAppearance({ cropLeft })}
        />
        <RangeField
          label="Crop right"
          min={0}
          max={0.45}
          step={0.01}
          value={settings.cropRight}
          onChange={(cropRight) => applyAppearance({ cropRight })}
        />
      </SectionCard>

      {/* NOTE: text input stays closed. She talks on her own.
      <SectionCard
        title="Chat input"
        description="Where the input sits around the companion. Default is top left."
      >
        <InputPositionPicker />
        <RangeField
          label="Input width"
          min={180}
          max={420}
          step={4}
          suffix="px"
          value={settings.dockWidth}
          onChange={(dockWidth) => applyAppearance({ dockWidth })}
        />
        <RangeField
          label="Gap from model"
          min={-80}
          max={24}
          step={1}
          suffix="px"
          value={settings.dockGap}
          onChange={(dockGap) => applyAppearance({ dockGap })}
        />
        <RangeField
          label="Move up / down"
          min={-160}
          max={160}
          step={4}
          suffix="px"
          value={settings.dockOffsetY}
          onChange={(dockOffsetY) => applyAppearance({ dockOffsetY })}
        />
      </SectionCard>
      */}
    </div>
  );
}
