import _ from 'lodash-es';
import { RegistryTypes } from 'Extensions/registry-management/models/registryTypes';

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
  this.Gitlab = data.Gitlab;
}

export function RegistryManagementConfigurationDefaultModel(registry) {
  this.Authentication = false;
  this.Password = '';
  this.TLS = false;
  this.TLSSkipVerify = false;
  this.TLSCACertFile = null;
  this.TLSCertFile = null;
  this.TLSKeyFile = null;

  if (registry.Type === RegistryTypes.QUAY || registry.Type === RegistryTypes.AZURE ) {
    this.Authentication = true;
    this.Username = registry.Username;
    this.TLS = true;
  }

  if (registry.Type === RegistryTypes.CUSTOM && registry.Authentication) {
    this.Authentication = true;
    this.Username = registry.Username;
  }
}

export function RegistryDefaultModel() {
  this.Type = RegistryTypes.CUSTOM;
  this.URL = '';
  this.Name = '';
  this.Authentication = false;
  this.Username = '';
  this.Password = '';
}

export function RegistryCreateRequest(model) {
  this.Name = model.Name;
  this.Type = model.Type;
  this.URL = _.replace(model.URL, /^https?\:\/\//i, '');
  this.Authentication = model.Authentication;
  if (model.Authentication) {
    this.Username = model.Username;
    this.Password = model.Password;
  }
  if (model.Type === RegistryTypes.GITLAB) {
    this.Gitlab = {
      ProjectId: model.Gitlab.ProjectId,
      InstanceURL: model.Gitlab.InstanceURL
    }
  }
}