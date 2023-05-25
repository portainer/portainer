import { EnvironmentId } from '../types';

export const queryKeys = {
  base: () => ['environments'] as const,
  item: (id: EnvironmentId) => [...queryKeys.base(), id] as const,
};
