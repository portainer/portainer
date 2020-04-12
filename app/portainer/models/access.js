// create UserAccessViewModel from UserViewModel
export function UserAccessViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Username;
  this.Type = 'user';
  this.Inherited = false;
  this.Override = false;
  this.Role = { Id: 0, Name: '-' };
  this.icon = '<i class="fa fa-user" aria-hidden="true"></i>';
}

// create TeamAccessViewModel from TeamViewModel
export function TeamAccessViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Type = 'team';
  this.Inherited = false;
  this.Override = false;
  this.Role = { Id: 0, Name: '-' };
  this.icon = '<i class="fa fa-users" aria-hidden="true"></i>';
}
