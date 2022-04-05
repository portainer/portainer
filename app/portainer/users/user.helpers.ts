import { Role, User } from './types';

export function filterNonAdministratorUsers(users: User[]) {
  return users.filter((user) => user.Role !== Role.Admin);
}

export function isAdmin(user?: User): boolean {
  return !!user && user.Role === 1;
}
