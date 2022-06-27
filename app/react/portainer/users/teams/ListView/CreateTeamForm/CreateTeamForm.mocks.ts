import { TeamViewModel } from '@/portainer/models/team';
import { UserViewModel } from '@/portainer/models/user';

export function mockExampleData() {
  const teams: TeamViewModel[] = [
    {
      Id: 3,
      Name: 'Team 1',
      Checked: false,
    },
    {
      Id: 4,
      Name: 'Team 2',
      Checked: false,
    },
  ];

  const users: UserViewModel[] = [
    {
      Id: 10,
      Username: 'user1',
      Role: 2,
      UserTheme: '',
      EndpointAuthorizations: {},
      PortainerAuthorizations: {
        PortainerDockerHubInspect: true,
        PortainerEndpointGroupInspect: true,
        PortainerEndpointGroupList: true,
        PortainerEndpointInspect: true,
        PortainerEndpointList: true,
        PortainerMOTD: true,
        PortainerRoleList: true,
        PortainerTeamList: true,
        PortainerTemplateInspect: true,
        PortainerTemplateList: true,
        PortainerUserInspect: true,
        PortainerUserList: true,
        PortainerUserMemberships: true,
      },
      RoleName: 'user',
      Checked: false,
      AuthenticationMethod: '',
    },
    {
      Id: 13,
      Username: 'user2',
      Role: 2,
      UserTheme: '',
      EndpointAuthorizations: {},
      PortainerAuthorizations: {
        PortainerDockerHubInspect: true,
        PortainerEndpointGroupInspect: true,
        PortainerEndpointGroupList: true,
        PortainerEndpointInspect: true,
        PortainerEndpointList: true,
        PortainerMOTD: true,
        PortainerRoleList: true,
        PortainerTeamList: true,
        PortainerTemplateInspect: true,
        PortainerTemplateList: true,
        PortainerUserInspect: true,
        PortainerUserList: true,
        PortainerUserMemberships: true,
      },
      RoleName: 'user',
      Checked: false,
      AuthenticationMethod: '',
    },
  ];

  return { users, teams };
}
