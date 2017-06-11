function RegistryViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.URL = data.URL;
  this.Authentication = data.Authentication;
  this.Username = data.Username;
  this.Password = data.Password;
  this.AuthorizedUsers = data.AuthorizedUsers;
  this.AuthorizedTeams = data.AuthorizedTeams;
  this.Checked = false;
}
