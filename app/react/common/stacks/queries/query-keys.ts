import { StackId } from '../types';

export const queryKeys = {
  base: () => ['stacks'] as const,
  stack: (stackId?: StackId) => [...queryKeys.base(), stackId] as const,
  stackFile: (stackId?: StackId, params?: unknown) =>
    [...queryKeys.stack(stackId), 'file', params] as const,
};
