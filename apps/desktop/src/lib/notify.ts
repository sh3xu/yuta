import { toast } from '@yuta/ui';
import type { AppError } from '../app/session';

export function notifyError(error: AppError): void {
  toast({
    variant: 'error',
    title: error.source,
    description:
      error.detail && !error.detail.includes('\n')
        ? `${error.message} ${error.detail}`
        : error.message,
  });
}
