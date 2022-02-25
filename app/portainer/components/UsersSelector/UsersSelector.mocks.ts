import { UserViewModel } from '@/portainer/models/user';

export function createMockUser(id: number, username: string): UserViewModel {
  return {
    Id: id,
    Username: username,
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
  };
}
