import type { ReactNode } from 'react';

export function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-ink/70 p-3">
      <div className="mb-3 flex items-start gap-2">
        {icon ? <div className="mt-0.5 text-accent">{icon}</div> : null}
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-cream">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-[11px] leading-4 text-mute">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
