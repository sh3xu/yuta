import { Switch } from '@yuta/ui';
import { Minimize2, Pin, Scaling } from 'lucide-react';
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
  const applyAppearance = useCompanionStore((state) => state.applyAppearance);

  return (
    <div className="flex flex-col gap-3">
      <SectionCard
        title="Placement"
        description="The sticker stays where you put it until you unlock it."
        icon={<Pin className="size-4" />}
      >
        <div className="flex h-10 items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3">
          <span className="text-sm">Lock position</span>
          <Switch
            checked={settings.positionLocked}
            onCheckedChange={(locked) => void setPositionLocked(locked)}
          />
        </div>
        <p className="text-[11px] leading-4 text-mute">
          {settings.positionLocked
            ? 'Unlock to drag the companion, then lock it again.'
            : 'Drag the companion, then lock or press Place here.'}
        </p>
        {settings.positionLocked ? null : (
          <button
            type="button"
            className="h-9 rounded-lg border border-line bg-panel text-sm text-cream hover:bg-white/10"
            onClick={() => void placeCompanion()}
          >
            Place here
          </button>
        )}
        <div className="flex h-10 items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3">
          <span className="text-sm">Always on top</span>
          <Switch
            checked={settings.alwaysOnTop}
            onCheckedChange={(value) => void applyAlwaysOnTop(value)}
          />
        </div>
        <div className="flex h-10 items-center justify-between gap-3 rounded-lg border border-line bg-ink px-3">
          <span className="text-sm">Look at cursor</span>
          <Switch
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

      <SectionCard
        title="Chat dock"
        description="Input and settings sit next to the head. Size and placement scale with the model."
      >
        <RangeField
          label="Dock width"
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
          label="Vertical offset"
          min={0}
          max={0.55}
          step={0.01}
          value={settings.dockOffsetY}
          onChange={(dockOffsetY) => applyAppearance({ dockOffsetY })}
        />
      </SectionCard>
    </div>
  );
}
