import { Filters } from './types';

export const queryKeys = {
  base: () => ['webhooks'] as const,
  list: (filters: Filters) => [...queryKeys.base(), { filters }],
};
