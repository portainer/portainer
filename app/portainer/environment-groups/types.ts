import { TagId } from '@/portainer/tags/types';

export type EnvironmentGroupId = number;

export interface EnvironmentGroup {
  // Environment(Endpoint) group Identifier
  Id: EnvironmentGroupId;
  // Environment(Endpoint) group name
  Name: string;
  // Description associated to the environment(endpoint) group
  Description: string;
  // List of tags associated to this environment(endpoint) group
  TagIds: TagId[];
}
