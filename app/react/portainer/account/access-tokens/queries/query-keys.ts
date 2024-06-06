import { userQueryKeys } from '@/portainer/users/queries/queryKeys';
import { UserId } from '@/portainer/users/types';

export const queryKeys = {
  base: (userId: UserId) => [...userQueryKeys.user(userId), 'tokens'] as const,
};
