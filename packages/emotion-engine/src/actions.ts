import type { ActionName } from '@yuta/shared';
import { ACTIONS } from '@yuta/shared';

export interface ActionProfile {
  name: ActionName;
}

export const ACTION_PROFILES: Record<ActionName, ActionProfile> = Object.fromEntries(
  ACTIONS.map((name) => [name, { name }]),
) as Record<ActionName, ActionProfile>;
