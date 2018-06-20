function UserAccessViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Username;
  this.Type = 'user';
  this.Inherited = false;
}

function TeamAccessViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Type = 'team';
  this.Inherited = false;
}
