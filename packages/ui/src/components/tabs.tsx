import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export function Tabs({
  value,
  onChange,
  items,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  items: Array<{ id: string; label: string; icon?: ReactNode }>;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
            value === item.id
              ? 'bg-accent text-ink'
              : 'text-mute hover:bg-white/10 hover:text-cream',
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
