import type { InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'box-border block h-10 w-full min-w-0 rounded-lg border border-line bg-ink px-3 text-sm text-cream outline-none placeholder:text-mute focus:border-accent',
        className,
      )}
      {...props}
    />
  );
}
