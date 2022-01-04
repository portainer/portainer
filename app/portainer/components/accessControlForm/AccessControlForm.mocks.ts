import _ from 'lodash';

import { UserViewModel } from '@/portainer/models/user';
import { Team } from '@/portainer/teams/types';

export function createMockUsers(count: number): UserViewModel[] {
  return _.range(1, count + 1).map((value) => ({
    Id: value,
    Username: `user${value}`,
    Role: _.random(1, 3),
    UserTheme: '',
    RoleName: '',
    AuthenticationMethod: '',
    Checked: false,
    EndpointAuthorizations: {},
    PortainerAuthorizations: {},
  }));
}

export function createMockTeams(count: number): Team[] {
  return _.range(1, count + 1).map((value) => ({
    Id: value,
    Name: `team${value}`,
  }));
}
