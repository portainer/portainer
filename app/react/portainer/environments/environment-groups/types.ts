import { TagId } from '@/portainer/tags/types';

import {
  TeamAccessPolicies,
  UserAccessPolicies,
  EnvironmentGroupId,
} from '../types';

export interface EnvironmentGroup {
  // Environment(Endpoint) group Identifier
  Id: EnvironmentGroupId;
  // Environment(Endpoint) group name
  Name: string;
  // Description associated to the environment(endpoint) group
  Description: string;
  // List of tags associated to this environment(endpoint) group
  TagIds: TagId[];
  UserAccessPolicies?: UserAccessPolicies;
  TeamAccessPolicies?: TeamAccessPolicies;
}
