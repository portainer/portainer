import {
  ResourceControlId,
  ResourceControlOwnership,
  ResourceControlResponse,
  ResourceControlType,
  ResourceId,
  TeamResourceAccess,
  UserResourceAccess,
} from '../types';

export class ResourceControlViewModel {
  Id: ResourceControlId;

  Type: ResourceControlType;

  ResourceId: ResourceId;

  UserAccesses: UserResourceAccess[];

  TeamAccesses: TeamResourceAccess[];

  Public: boolean;

  System: boolean;

  Ownership: ResourceControlOwnership;

  constructor(data: ResourceControlResponse) {
    this.Id = data.Id;
    this.Type = data.Type;
    this.ResourceId = data.ResourceId;
    this.UserAccesses = data.UserAccesses;
    this.TeamAccesses = data.TeamAccesses;
    this.Public = data.Public;
    this.System = data.System;
    this.Ownership = determineOwnership(data);
  }
}

export function determineOwnership(resourceControl: ResourceControlResponse) {
  if (resourceControl.Public) {
    return ResourceControlOwnership.PUBLIC;
  }

  if (
    resourceControl.UserAccesses.length === 1 &&
    resourceControl.TeamAccesses.length === 0
  ) {
    return ResourceControlOwnership.PRIVATE;
  }

  if (
    resourceControl.UserAccesses.length > 1 ||
    resourceControl.TeamAccesses.length > 0
  ) {
    return ResourceControlOwnership.RESTRICTED;
  }

  return ResourceControlOwnership.ADMINISTRATORS;
}
