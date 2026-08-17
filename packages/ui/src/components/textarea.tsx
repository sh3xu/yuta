import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'box-border block min-h-24 w-full min-w-0 resize-y rounded-lg border border-line bg-ink px-3 py-2 text-sm leading-6 text-cream outline-none placeholder:text-mute focus:border-accent',
        className,
      )}
      {...props}
    />
  );
}
