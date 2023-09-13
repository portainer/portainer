import { EnvironmentGroupId } from '../types';

export const queryKeys = {
  base: () => ['environment-groups'] as const,
  group: (id: EnvironmentGroupId) => [...queryKeys.base(), id] as const,
};
