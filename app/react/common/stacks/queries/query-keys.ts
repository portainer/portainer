import { StackId } from '../types';

export const stacksQueryKeys = {
  stackFile: (stackId: StackId) => ['stacks', stackId, 'file'] as const,
  stacks: ['stacks'] as const,
};
