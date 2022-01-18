export function UserViewModel(data) {
  this.Id = data.Id;
  this.Username = data.Username;
  this.Role = data.Role;
  this.UserTheme = data.UserTheme;
  if (data.Role === 1) {
    this.RoleName = 'administrator';
  } else {
    this.RoleName = 'user';
  }
  this.AuthenticationMethod = data.AuthenticationMethod;
  this.Checked = false;
  this.EndpointAuthorizations = null;
  this.PortainerAuthorizations = null;
}

export function UserTokenModel(data) {
  this.id = data.id;
  this.userId = data.userId;
  this.description = data.description;
  this.prefix = data.prefix;
  this.dateCreated = data.dateCreated;
  this.lastUsed = data.lastUsed;
}
