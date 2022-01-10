import { ResourceControlOwnership as RCO } from './resourceControlOwnership';

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

export interface ResourceControlResponse {
  Id: number;
  Type: ResourceControlType;
  ResourceId: string | number;
  UserAccesses: unknown[];
  TeamAccesses: unknown[];
  Public: boolean;
  AdministratorsOnly: boolean;
  System: boolean;
}

export class ResourceControlViewModel {
  Id: number;

  Type: ResourceControlType;

  ResourceId: string | number;

  UserAccesses: unknown[];

  TeamAccesses: unknown[];

  Public: boolean;

  System: boolean;

  Ownership: RCO;

  constructor(data: ResourceControlResponse) {
    this.Id = data.Id;
    this.Type = data.Type;
    this.ResourceId = data.ResourceId;
    this.UserAccesses = data.UserAccesses;
    this.TeamAccesses = data.TeamAccesses;
    this.Public = data.Public;
    this.System = data.System;
    this.Ownership = determineOwnership(this);
  }
}

function determineOwnership(resourceControl: ResourceControlViewModel) {
  if (resourceControl.Public) {
    return RCO.PUBLIC;
  }

  if (
    resourceControl.UserAccesses.length === 1 &&
    resourceControl.TeamAccesses.length === 0
  ) {
    return RCO.PRIVATE;
  }

  if (
    resourceControl.UserAccesses.length > 1 ||
    resourceControl.TeamAccesses.length > 0
  ) {
    return RCO.RESTRICTED;
  }

  return RCO.ADMINISTRATORS;
}
