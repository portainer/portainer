import { ResourceControlOwnership as RCO } from 'Portainer/models/resourceControl/resourceControlOwnership';

export function ResourceControlViewModel(data) {
  this.Id = data.Id;
  this.Type = data.Type;
  this.ResourceId = data.ResourceId;
  this.UserAccesses = data.UserAccesses;
  this.TeamAccesses = data.TeamAccesses;
  this.Public = data.Public;
  this.System = data.System;
  this.Ownership = determineOwnership(this);
}

function determineOwnership(resourceControl) {
  if (resourceControl.Public) {
    return RCO.PUBLIC;
  } else if (resourceControl.UserAccesses.length === 1 && resourceControl.TeamAccesses.length === 0) {
    return RCO.PRIVATE;
  } else if (resourceControl.UserAccesses.length > 1 || resourceControl.TeamAccesses.length > 0) {
    return RCO.RESTRICTED;
  } else {
    return RCO.ADMINISTRATORS;
  }
}
