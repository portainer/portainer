import { UserId } from '../types';

export const userQueryKeys = {
  base: () => ['users'] as const,
  user: (id: UserId) => [...userQueryKeys.base(), id] as const,
  me: () => [...userQueryKeys.base(), 'me'] as const,
};
