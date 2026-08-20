import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../lib/cn';
import { dismissToast, subscribeToasts, type ToastItem } from '../toast';

const TONE: Record<ToastItem['variant'], string> = {
  error: 'border-rose-400/50 bg-rose-950 text-rose-50',
  success: 'border-emerald-400/40 bg-emerald-950 text-emerald-50',
  info: 'border-line bg-panel text-cream',
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-3 right-3 left-3 z-50 flex flex-col items-end gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'pointer-events-auto w-full max-w-sm rounded-xl border px-3 py-3 shadow-lg',
            TONE[item.variant],
          )}
          data-yuta-hit="ui"
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium tracking-wide uppercase opacity-70">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-sm leading-5">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-white/10"
              onClick={() => dismissToast(item.id)}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
