import { TeamId } from '../types';

export const queryKeys = {
  base: () => ['teams'] as const,
  list: (params: unknown) => [...queryKeys.base(), 'list', params] as const,
  item: (id: TeamId) => [...queryKeys.base(), id] as const,
  memberships: (id?: TeamId) =>
    [...queryKeys.base(), 'memberships', id] as const,
};
