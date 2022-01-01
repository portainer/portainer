import _ from 'lodash-es';
import { RegistryTypes } from './registryTypes';

export function RegistryViewModel(data) {
  this.Id = data.Id;
  this.Type = data.Type;
  this.Name = data.Name;
  this.URL = data.URL;
  this.BaseURL = data.BaseURL;
  this.Authentication = data.Authentication;
  this.Username = data.Username;
  this.Password = data.Password;
  this.RegistryAccesses = data.RegistryAccesses; // map[EndpointID]{UserAccessPolicies, TeamAccessPolicies, NamespaceAccessPolicies}
  this.Checked = false;
  this.Gitlab = data.Gitlab;
  this.Quay = data.Quay;
  this.Ecr = data.Ecr;
}

export function RegistryManagementConfigurationDefaultModel(registry) {
  this.Authentication = false;
  this.Password = '';
  this.TLS = false;
  this.TLSSkipVerify = false;
  this.TLSCACertFile = null;
  this.TLSCertFile = null;
  this.TLSKeyFile = null;

  if (registry.Type === RegistryTypes.ECR) {
    this.Region = registry.Ecr.Region;
    this.TLSSkipVerify = true;
  }

  if (registry.Type === RegistryTypes.QUAY || registry.Type === RegistryTypes.AZURE || registry.Type === RegistryTypes.ECR) {
    this.Authentication = true;
    this.Username = registry.Username;
    this.TLS = true;
  }

  if ((registry.Type === RegistryTypes.CUSTOM || registry.Type === RegistryTypes.PROGET) && registry.Authentication) {
    this.Authentication = true;
    this.Username = registry.Username;
  }
}

export function RegistryCreateFormValues() {
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
  this.URL = _.replace(this.URL, /\/$/, '');
  this.Authentication = model.Authentication;
  if (model.Authentication) {
    this.Username = model.Username;
    this.Password = model.Password;
  }
  if (model.Type === RegistryTypes.GITLAB) {
    this.Gitlab = {
      ProjectId: model.Gitlab.ProjectId,
      InstanceURL: model.Gitlab.InstanceURL,
      ProjectPath: model.Gitlab.ProjectPath,
    };
  }
  if (model.Type === RegistryTypes.ECR) {
    this.Ecr = model.Ecr;
  }
  if (model.Type === RegistryTypes.QUAY) {
    this.Quay = {
      useOrganisation: model.Quay.useOrganisation,
      organisationName: model.Quay.organisationName,
    };
  }
  if (model.Type === RegistryTypes.PROGET) {
    this.BaseURL = _.replace(model.BaseURL, /^https?\:\/\//i, '');
    this.BaseURL = _.replace(this.BaseURL, /\/$/, '');
  }
}
