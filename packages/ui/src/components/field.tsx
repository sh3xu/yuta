import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn('flex w-full min-w-0 flex-col gap-1.5', className)}>
      <span className="text-xs font-medium tracking-wide text-mute">{label}</span>
      {children}
      {hint ? <span className="text-xs text-mute">{hint}</span> : null}
    </label>
  );
}
