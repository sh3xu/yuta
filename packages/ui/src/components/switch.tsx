import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../lib/cn';

export function Switch({
  checked,
  onCheckedChange,
  className,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border p-0.5 outline-none transition-colors',
        checked ? 'border-accent bg-accent' : 'border-line bg-white/10',
        className,
      )}
      type="button"
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block size-5 rounded-full shadow-sm transition-transform',
          checked ? 'translate-x-5 bg-ink' : 'translate-x-0 bg-cream',
        )}
      />
    </SwitchPrimitive.Root>
  );
}
