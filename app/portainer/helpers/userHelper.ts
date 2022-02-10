import { UserViewModel } from '../models/user';

export function filterNonAdministratorUsers(users: UserViewModel[]) {
  return users.filter((user) => user.Role !== 1);
}
