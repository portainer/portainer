import {
  Environment,
  EnvironmentId,
} from '@/react/portainer/environments/types';
import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';

import { RbacRole } from '../types';
import { Team, TeamId } from '../../teams/types';

export class AccessViewerPolicyModel {
  EndpointId: EnvironmentId;

  EndpointName: string;

  RoleId: RbacRole['Id'];

  RoleName: RbacRole['Name'];

  RolePriority: RbacRole['Priority'];

  GroupId?: EnvironmentGroup['Id'];

  GroupName?: EnvironmentGroup['Name'];

  TeamId?: TeamId;

  TeamName?: Team['Name'];

  AccessLocation: string;

  constructor(
    policy: { RoleId: RbacRole['Id'] },
    endpoint: Environment,
    roles: Record<RbacRole['Id'], RbacRole>,
    group?: EnvironmentGroup,
    team?: Team
  ) {
    this.EndpointId = endpoint.Id;
    this.EndpointName = endpoint.Name;
    this.RoleId = policy.RoleId;
    this.RoleName = roles[policy.RoleId].Name;
    this.RolePriority = roles[policy.RoleId].Priority;
    if (group) {
      this.GroupId = group.Id;
      this.GroupName = group.Name;
    }
    if (team) {
      this.TeamId = team.Id;
      this.TeamName = team.Name;
    }
    this.AccessLocation = group ? 'environment group' : 'environment';
  }
}
