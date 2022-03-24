import _ from 'lodash';

import { Team } from '@/portainer/teams/types';
import { Role, User, UserId } from '@/portainer/users/types';

export function createMockUsers(
  count: number,
  roles: Role | Role[] | ((id: UserId) => Role) = () => _.random(1, 3)
): User[] {
  return _.range(1, count + 1).map((value) => ({
    Id: value,
    Username: `user${value}`,
    Role: getRoles(roles, value),
    UserTheme: '',
    RoleName: '',
    AuthenticationMethod: '',
    Checked: false,
    EndpointAuthorizations: {},
    PortainerAuthorizations: {},
  }));
}

function getRoles(
  roles: Role | Role[] | ((id: UserId) => Role),
  id: UserId
): Role {
  if (typeof roles === 'function') {
    return roles(id);
  }

  if (typeof roles === 'number') {
    return roles;
  }

  return roles[id];
}

export function createMockTeams(count: number): Team[] {
  return _.range(1, count + 1).map((value) => ({
    Id: value,
    Name: `team${value}`,
  }));
}

export function createMockSubscriptions(count: number) {
  const subscriptions = _.range(1, count + 1).map((x) => ({
    id: `/subscriptions/subscription-${x}`,
    subscriptionId: `subscription-${x}`,
  }));

  return { value: subscriptions };
}

export function createMockResourceGroups(subscription: string, count: number) {
  const resourceGroups = _.range(1, count + 1).map((x) => ({
    id: `/subscriptions/${subscription}/resourceGroups/resourceGroup-${x}`,
    name: `resourcegroup-${x}`,
  }));

  return { value: resourceGroups };
}
