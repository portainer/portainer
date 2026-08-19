import { EnvironmentId } from '@/react/portainer/environments/types';
import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';

import { RbacRole } from '../types';
import { Team, TeamId } from '../../teams/types';

/**
 * AccessLocation describes which part of the access model granted the user
 * their effective role on an environment. Wire values match the CE backend
 * `AccessLocation` type — display labels are derived in the UI layer.
 */
export const AccessLocation = {
  Environment: 'environment',
  EnvironmentGroup: 'environmentGroup',
} as const;

export type AccessLocation =
  (typeof AccessLocation)[keyof typeof AccessLocation];

export interface AccessViewerPolicyModel {
  endpointId: EnvironmentId;
  endpointName: string;
  roleId: RbacRole['Id'];
  roleName: RbacRole['Name'];
  rolePriority: RbacRole['Priority'];
  groupId?: EnvironmentGroup['Id'];
  groupName?: EnvironmentGroup['Name'];
  teamId?: TeamId;
  teamName?: Team['Name'];
  accessLocation: AccessLocation;
}
