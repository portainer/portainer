import { Environment } from '@/react/portainer/environments/types';
import { isEdgeEnvironment } from '@/react/portainer/environments/utils';

import { Role, User } from './types';

export function filterNonAdministratorUsers(users: User[]) {
  return users.filter((user) => !isPureAdmin(user));
}

type UserLike = Pick<User, 'Role'>;

// To avoid creating divergence between CE and EE
/**
 * isEdgeAdmin checks if the user is edge admin or admin
 */
export function isEdgeAdmin(
  user: UserLike | undefined,
  environment?: Pick<Environment, 'Type'> | null
): boolean {
  return (
    isPureAdmin(user) ||
    (user?.Role === Role.EdgeAdmin &&
      (!environment || isEdgeEnvironment(environment.Type)))
  );
}

// To avoid creating divergence between CE and EE
/**
 * isPureAdmin checks if the user is portainer admin.
 * See bouncer.IsAdmin and bouncer.PureAdminAccess
 */
export function isPureAdmin(user?: UserLike): boolean {
  return !!user && user.Role === Role.Admin;
}
