import { INPUT_CORNERS, type InputCorner } from '../../lib/settings';
import { useCompanionStore } from '../../stores/companion-store';

const LABELS: Record<InputCorner, string> = {
  'left-top': 'Top left',
  'right-top': 'Top right',
  'left-bottom': 'Bottom left',
  'right-bottom': 'Bottom right',
};

export function InputPositionPicker() {
  const corner = useCompanionStore((state) => state.settings.inputCorner);
  const applyAppearance = useCompanionStore((state) => state.applyAppearance);

  return (
    <div className="grid grid-cols-2 gap-1">
      {INPUT_CORNERS.map((id) => (
        <button
          key={id}
          type="button"
          title={LABELS[id]}
          aria-label={LABELS[id]}
          aria-pressed={corner === id}
          className="h-8 rounded-md border border-line text-[11px] text-cream hover:bg-white/10"
          style={
            corner === id
              ? { background: 'rgba(232, 184, 109, 0.92)', color: '#12151c', borderColor: 'transparent' }
              : undefined
          }
          onClick={() => applyAppearance({ inputCorner: id })}
        >
          {LABELS[id]}
        </button>
      ))}
    </div>
  );
}
