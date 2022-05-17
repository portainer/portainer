import _ from 'lodash';
import { RegistryTypes } from 'Portainer/models/registryTypes';
import { RegistryCreateFormValues } from 'Portainer/models/registry';

class CreateRegistryController {
  /* @ngInject */
  constructor($async, $state, Notifications, RegistryService, RegistryGitlabService) {
    Object.assign(this, { $async, $state, Notifications, RegistryService, RegistryGitlabService });

    this.RegistryTypes = RegistryTypes;
    this.state = {
      actionInProgress: false,
      overrideConfiguration: false,
      gitlab: {
        get selectedItemCount() {
          return this.selectedItems.length || 0;
        },
        selectedItems: [],
      },
      originViewReference: 'portainer.registries',
      originalEndpointId: null,
    };

    this.createRegistry = this.createRegistry.bind(this);
    this.getRegistries = this.getRegistries.bind(this);
    this.nameIsUsed = this.nameIsUsed.bind(this);
    this.retrieveGitlabRegistries = this.retrieveGitlabRegistries.bind(this);
    this.createGitlabRegistries = this.createGitlabRegistries.bind(this);
  }

  useDefaultQuayConfiguration() {
    this.model.Quay.useOrganisation = false;
    this.model.Quay.organisationName = '';
  }

  selectQuayRegistry() {
    this.model.Name = 'Quay';
    this.model.URL = 'quay.io';
    this.model.Authentication = true;
    this.model.Quay = {};
    this.useDefaultQuayConfiguration();
  }

  useDefaultGitlabConfiguration() {
    this.model.URL = 'https://registry.gitlab.com';
    this.model.Gitlab.InstanceURL = 'https://gitlab.com';
  }

  selectGitlabRegistry() {
    this.model.Name = '';
    this.model.Authentication = true;
    this.model.Gitlab = {};
    this.useDefaultGitlabConfiguration();
  }

  selectAzureRegistry() {
    this.model.Name = '';
    this.model.URL = '';
    this.model.Authentication = true;
  }

  selectProGetRegistry() {
    this.model.Name = '';
    this.model.URL = '';
    this.model.BaseURL = '';
    this.model.Authentication = true;
  }

  selectCustomRegistry() {
    this.model.Name = '';
    this.model.URL = '';
    this.model.Authentication = false;
  }

  selectDockerHub() {
    this.model.Name = '';
    this.model.URL = 'docker.io';
    this.model.Authentication = true;
  }

  useDefaultEcrConfiguration() {
    this.model.Ecr.Region = '';
  }

  selectEcr() {
    this.model.Name = '';
    this.model.URL = '';
    this.model.Authentication = false;
    this.model.Ecr = {};
    this.useDefaultEcrConfiguration();
  }

  retrieveGitlabRegistries() {
    return this.$async(async () => {
      this.state.actionInProgress = true;
      try {
        this.gitlabProjects = await this.RegistryGitlabService.projects(this.model.Gitlab.InstanceURL, this.model.Token);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve projects');
      } finally {
        this.state.actionInProgress = false;
      }
    });
  }

  createGitlabRegistries() {
    return this.$async(async () => {
      try {
        this.state.actionInProgress = true;
        await this.RegistryService.createGitlabRegistries(this.model, this.state.gitlab.selectedItems);
        this.Notifications.success('Registries successfully created');
        this.$state.go(this.state.originViewReference, { endpointId: this.state.originalEndpointId });
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to create registries');
        this.state.actionInProgress = false;
      }
    });
  }

  createRegistry() {
    return this.$async(async () => {
      try {
        this.state.actionInProgress = true;
        await this.RegistryService.createRegistry(this.model);
        this.Notifications.success('Registry successfully created');
        this.$state.go(this.state.originViewReference, { endpointId: this.state.originalEndpointId });
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to create registry');
        this.state.actionInProgress = false;
      }
    });
  }

  nameIsUsed(name) {
    return _.includes(this.registriesNames, name);
  }

  getRegistries() {
    return this.$async(async () => {
      try {
        const registries = await this.RegistryService.registries();
        this.registriesNames = _.map(registries, 'Name');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to fetch existing registries');
      }
    });
  }

  $onInit() {
    return this.$async(async () => {
      this.model = new RegistryCreateFormValues();

      const from = this.$transition$.from();
      const params = this.$transition$.params('from');

      if (from.name && /^[a-z]+\.registries$/.test(from.name)) {
        this.state.originViewReference = from;
        this.state.originalEndpointId = params.endpointId || null;
      }
      await this.getRegistries();
    });
  }
}

export default CreateRegistryController;
