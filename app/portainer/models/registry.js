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

function RegistryManagementConfigurationModel() {
  this.Authentication = false;
  this.Username = '';
  this.Password = '';
  this.TLS = false;
  this.TLSSkipVerify = false;
  this.TLSCertFile = null;
  this.TLSKeyFile = null;
}
