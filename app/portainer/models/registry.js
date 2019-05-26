export function RegistryViewModel(data) {
  this.Id = data.Id;
  this.Type = data.Type;
  this.Name = data.Name;
  this.URL = data.URL;
  this.Authentication = data.Authentication;
  this.Username = data.Username;
  this.Password = data.Password;
  this.AuthorizedUsers = data.AuthorizedUsers;
  this.AuthorizedTeams = data.AuthorizedTeams;
  this.UserAccessPolicies = data.UserAccessPolicies;
  this.TeamAccessPolicies = data.TeamAccessPolicies;
  this.Checked = false;
}

export function RegistryManagementConfigurationDefaultModel(registry) {
  this.Authentication = false;
  this.Password = '';
  this.TLS = false;
  this.TLSSkipVerify = false;
  this.TLSCACertFile = null;
  this.TLSCertFile = null;
  this.TLSKeyFile = null;

  if (registry.Type === 1 || registry.Type === 2 ) {
    this.Authentication = true;
    this.Username = registry.Username;
    this.TLS = true;
  }

  if (registry.Type === 3 && registry.Authentication) {
    this.Authentication = true;
    this.Username = registry.Username;
  }
}

export function RegistryDefaultModel() {
  this.Type = 3;
  this.URL = '';
  this.Name = '';
  this.Authentication = false;
  this.Username = '';
  this.Password = '';
}

export function RegistryCreateRequest(model) {
  this.Name = model.Name;
  this.Type = model.Type;
  this.URL = model.URL;
  this.Authentication = model.Authentication;
  if (model.Authentication) {
    this.Username = model.Username;
    this.Password = model.Password;
  }
}
