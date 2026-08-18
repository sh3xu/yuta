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
        'relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border border-line bg-white/10 outline-none data-[state=checked]:bg-accent',
        className,
      )}
      type="button"
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-cream transition-transform data-[state=checked]:translate-x-4 data-[state=checked]:bg-ink" />
    </SwitchPrimitive.Root>
  );
}
