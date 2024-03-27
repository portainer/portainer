import { type User } from '@/portainer/users/types';

export type DecoratedUser = User & {
  isTeamLeader?: boolean;
  authMethod: string;
};
