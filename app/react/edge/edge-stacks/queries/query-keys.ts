import { EdgeStack } from '../types';

export const queryKeys = {
  base: () => ['edge-stacks'] as const,
  item: (id: EdgeStack['Id']) => [...queryKeys.base(), id] as const,
};
