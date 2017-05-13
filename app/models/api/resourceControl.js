function ResourceControlViewModel(data) {
  this.Id = data.Id;
  this.Type = data.Type;
  this.ResourceId = data.ResourceId;
  this.Users = data.Users;
  this.Teams = data.Teams;
  this.AdministratorsOnly = data.AdministratorsOnly;
  this.Ownership = determineOwnership(this);
}

function determineOwnership(resourceControl) {
  if (resourceControl.AdministratorsOnly) {
    return 'administrators';
  } else if (resourceControl.Users.length === 1 && resourceControl.Teams.length === 0) {
    return 'private';
  } else if (resourceControl.Users.length > 1 || resourceControl.Teams.length > 0) {
    return 'restricted';
  }
}
