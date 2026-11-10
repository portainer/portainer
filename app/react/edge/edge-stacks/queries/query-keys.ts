import { EdgeStack } from '../types';

export const queryKeys = {
  base: () => ['edge-stacks'] as const,
  list: (params: { summarizeStatuses?: boolean } = {}) =>
    [...queryKeys.base(), 'list', params] as const,
  item: (id: EdgeStack['Id']) => [...queryKeys.base(), id] as const,
  file: (id: EdgeStack['Id'], version?: number) =>
    [...queryKeys.item(id), 'file', { version }] as const,
};
