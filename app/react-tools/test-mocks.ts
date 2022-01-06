import _ from 'lodash';

export function createMockUsers(count: number) {
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

export function createMockTeams(count: number) {
  return _.range(1, count + 1).map((value) => ({
    Id: value,
    Name: `team${value}`,
  }));
}
