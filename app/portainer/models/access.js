export function UserAccessViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Username;
  this.Type = 'user';
  this.Inherited = false;
  this.icon = '<i class="fa fa-user" aria-hidden="true"></i>';
}

export function TeamAccessViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Type = 'team';
  this.Inherited = false;
  this.icon = '<i class="fa fa-users" aria-hidden="true"></i>';
}
