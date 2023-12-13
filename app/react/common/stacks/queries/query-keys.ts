import { StackId } from '../types';

export const stacksQueryKeys = {
  stackFile: (stackId: StackId) => ['stacks', stackId, 'file'],
  stacks: ['stacks'],
};
