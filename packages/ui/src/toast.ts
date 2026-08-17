export type ToastVariant = 'error' | 'success' | 'info';

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export interface ToastItem extends ToastInput {
  id: string;
  variant: ToastVariant;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener(items);
}

export function toast(input: ToastInput): string {
  const item: ToastItem = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    variant: input.variant ?? 'info',
  };
  items = [...items, item].slice(-4);
  emit();
  window.setTimeout(() => dismissToast(item.id), 7000);
  return item.id;
}

export function dismissToast(id: string): void {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(items);
  return () => listeners.delete(listener);
}
