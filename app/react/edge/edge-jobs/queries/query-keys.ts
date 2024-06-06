import { EdgeJob } from '../types';

export const queryKeys = {
  base: () => ['edge', 'jobs'] as const,
  item: (id: EdgeJob['Id']) => [...queryKeys.base(), id] as const,
  file: (id: EdgeJob['Id']) => [...queryKeys.item(id), 'file'] as const,
};
