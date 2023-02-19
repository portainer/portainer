import { UserId } from '../types';

export const queryKeys = {
  base: () => ['users'] as const,
  user: (id: UserId) => [...queryKeys.base(), id] as const,
};
