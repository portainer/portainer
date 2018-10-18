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

function RegistryDefaultModel() {
  this.Type = 3;
  this.URL = '';
  this.Name = '';
  this.Authentication = false;
  this.Username = '';
  this.Password = '';
}

function RegistryCreateRequest(model) {
  this.Name = model.Name;
  this.Type = model.Type;
  this.URL = model.URL;
  this.Authentication = model.Authentication;
  if (model.Authentication) {
    this.Username = model.Username;
    this.Password = model.Password;
  }
}
