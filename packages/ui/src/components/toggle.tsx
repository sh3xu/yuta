import { cn } from '../lib/cn';

export function Toggle({
  checked,
  onCheckedChange,
  className,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex shrink-0 rounded-full border border-line bg-panel p-0.5', className)}>
      <button
        type="button"
        aria-pressed={!checked}
        className={cn(
          'h-7 min-w-10 rounded-full px-2.5 text-xs font-medium transition-colors',
          checked ? 'text-mute hover:text-cream' : 'bg-white/15 text-cream',
        )}
        onClick={() => onCheckedChange(false)}
      >
        Off
      </button>
      <button
        type="button"
        aria-pressed={checked}
        className={cn(
          'h-7 min-w-10 rounded-full px-2.5 text-xs font-medium transition-colors',
          checked ? 'bg-accent text-ink' : 'text-mute hover:text-cream',
        )}
        onClick={() => onCheckedChange(true)}
      >
        On
      </button>
    </div>
  );
}
