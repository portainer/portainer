function ResourceControlViewModel(data) {
  this.Id = data.Id;
  this.Type = data.Type;
  this.ResourceId = data.ResourceId;
  this.UserAccesses = data.UserAccesses;
  this.TeamAccesses = data.TeamAccesses;
  this.AdministratorsOnly = data.AdministratorsOnly;
  this.Ownership = determineOwnership(this);
}

function determineOwnership(resourceControl) {
  if (resourceControl.AdministratorsOnly) {
    return 'administrators';
  } else if (resourceControl.UserAccesses.length === 1 && resourceControl.TeamAccesses.length === 0) {
    return 'private';
  } else if (resourceControl.UserAccesses.length > 1 || resourceControl.TeamAccesses.length > 0) {
    return 'restricted';
  }
}
