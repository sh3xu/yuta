import { ACTIONS, type ActionName } from '@yuta/shared';
import { Button, Field } from '@yuta/ui';
import { useState } from 'react';
import { useCompanionStore } from '../../stores/companion-store';

function actionLabel(name: ActionName): string {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

export function AnimationPreview() {
  const playAction = useCompanionStore((state) => state.playAction);
  const current = useCompanionStore((state) => state.characterState.action);
  const [intensity, setIntensity] = useState(1);

  return (
    <div className="flex min-w-0 flex-col gap-3 border-t border-line pt-4">
      <h3 className="font-display text-lg">Preview animations</h3>
      <p className="text-xs text-mute">Plays on the character. Not saved.</p>
      <Field label={`Intensity ${intensity.toFixed(2)}`}>
        <input
          type="range"
          min={0.4}
          max={1}
          step={0.05}
          value={intensity}
          onChange={(event) => setIntensity(Number(event.target.value))}
          className="h-8 w-full accent-accent"
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map((action) => (
          <Button
            key={action}
            type="button"
            size="sm"
            variant={current === action ? 'default' : 'outline'}
            onClick={() => playAction(action, intensity)}
          >
            {actionLabel(action)}
          </Button>
        ))}
      </div>
    </div>
  );
}
