export function ResourceControlViewModel(data) {
  this.Id = data.Id;
  this.Type = data.Type;
  this.ResourceId = data.ResourceId;
  this.UserAccesses = data.UserAccesses;
  this.TeamAccesses = data.TeamAccesses;
  this.Public = data.Public;
  this.Ownership = determineOwnership(this);
}

function determineOwnership(resourceControl) {
  if (resourceControl.Public) {
    return 'public';
  } else if (resourceControl.UserAccesses.length === 1 && resourceControl.TeamAccesses.length === 0) {
    return 'private';
  } else if (resourceControl.UserAccesses.length > 1 || resourceControl.TeamAccesses.length > 0) {
    return 'restricted';
  } else {
    return 'administrators';
  }
}
