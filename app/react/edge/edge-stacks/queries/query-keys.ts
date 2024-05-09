import { EdgeStack } from '../types';

export const queryKeys = {
  base: () => ['edge-stacks'] as const,
  item: (id: EdgeStack['Id']) => [...queryKeys.base(), id] as const,
  file: (id: EdgeStack['Id'], version?: number) =>
    [...queryKeys.item(id), 'file', { version }] as const,
};
