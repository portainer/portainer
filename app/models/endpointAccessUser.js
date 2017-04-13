function EndpointAccessUserViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Username;
  this.Type = "user";
}

function EndpointAccessUserGroupViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Type = "usergroup";
}
