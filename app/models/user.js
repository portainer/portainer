function UserViewModel(data) {
  this.Id = data.Id;
  this.Username = data.Username;
  this.RoleId = data.Role;
  if (data.Role === 1) {
    this.RoleName = 'administrator';
  } else if (data.Role === 3) {
    this.RoleName = 'team leader';
  } else {
    this.RoleName = 'user';
  }
  this.Checked = false;
}
