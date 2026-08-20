export function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex w-full min-w-0 shrink-0 flex-col gap-1">
      <span className="flex items-center justify-between text-[11px] text-mute">
        <span>{label}</span>
        <span className="text-cream/80">
          {formatValue(value, step)}
          {suffix ?? ''}
        </span>
      </span>
      <div className="flex h-5 w-full shrink-0 items-center overflow-hidden">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="settings-range w-full cursor-pointer"
        />
      </div>
    </label>
  );
}

function formatValue(value: number, step: number): string {
  if (step >= 1) return String(Math.round(value));
  return value.toFixed(2);
}
