import { TeamId } from '@/portainer/teams/types';
import { UserId } from '@/portainer/users/types';

export type ResourceControlId = number;

export type ResourceId = number | string;

export enum ResourceControlOwnership {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
  ADMINISTRATORS = 'administrators',
}

/**
 * Transient type from view data to payload
 */
export interface OwnershipParameters {
  administratorsOnly: boolean;
  public: boolean;
  users: UserId[];
  teams: TeamId[];
  subResourcesIds: ResourceId[];
}

export enum ResourceControlType {
  // Container represents a resource control associated to a Docker container
  Container = 1,
  // Service represents a resource control associated to a Docker service
  Service,
  // Volume represents a resource control associated to a Docker volume
  Volume,
  // Network represents a resource control associated to a Docker network
  Network,
  // Secret represents a resource control associated to a Docker secret
  Secret,
  // Stack represents a resource control associated to a stack composed of Docker services
  Stack,
  // Config represents a resource control associated to a Docker config
  Config,
  // CustomTemplate represents a resource control associated to a custom template
  CustomTemplate,
  // ContainerGroup represents a resource control associated to an Azure container group
  ContainerGroup,
}

enum ResourceAccessLevel {
  ReadWriteAccessLevel = 1,
}

export interface UserResourceAccess {
  UserId: UserId;
  AccessLevel: ResourceAccessLevel;
}

export interface TeamResourceAccess {
  TeamId: TeamId;
  AccessLevel: ResourceAccessLevel;
}

export interface ResourceControlResponse {
  Id: number;
  Type: ResourceControlType;
  ResourceId: ResourceId;
  UserAccesses: UserResourceAccess[];
  TeamAccesses: TeamResourceAccess[];
  Public: boolean;
  AdministratorsOnly: boolean;
  System: boolean;
}

export interface AccessControlFormData {
  ownership: ResourceControlOwnership;
  authorizedUsers: UserId[];
  authorizedTeams: TeamId[];
}
