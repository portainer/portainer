import { RegistryTypes } from '@/portainer/registry-management/models/registryTypes';
import { RegistryManagementConfigurationDefaultModel } from '@/portainer/models/registry';

export class ConfigureRegistryController {
  constructor($async, $state, RegistryService, RegistryServiceSelector, Notifications) {
    Object.assign(this, { $async, $state, RegistryService, RegistryServiceSelector, Notifications });

    this.state = {
      testInProgress: false,
      updateInProgress: false,
      validConfiguration: false,
    };

    this.testConfiguration = this.testConfiguration.bind(this);
    this.testConfigurationAsync = this.testConfigurationAsync.bind(this);
    this.updateConfiguration = this.updateConfiguration.bind(this);
    this.updateConfigurationAsync = this.updateConfigurationAsync.bind(this);
    this.$onInit = this.$onInit.bind(this);
  }

  testConfiguration() {
    return this.$async(this.testConfigurationAsync);
  }
  async testConfigurationAsync() {
    this.state.testInProgress = true;
    try {
      await this.RegistryService.configureRegistry(this.registry.Id, this.model);
      await this.RegistryServiceSelector.ping(this.registry, true);

      this.Notifications.success('Success', 'Valid management configuration');
      this.state.validConfiguration = true;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Invalid management configuration');
    }

    this.state.testInProgress = false;
  }

  updateConfiguration() {
    return this.$async(this.updateConfigurationAsync);
  }
  async updateConfigurationAsync() {
    this.state.updateInProgress = true;
    try {
      await this.RegistryService.configureRegistry(this.registry.Id, this.model);
      this.Notifications.success('Success', 'Registry management configuration updated');
      this.$state.go('portainer.registries.registry.repositories', { id: this.registry.Id }, { reload: true });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update registry management configuration');
    }

    this.state.updateInProgress = false;
  }

  async $onInit() {
    const registryId = this.$state.params.id;
    this.RegistryTypes = RegistryTypes;

    try {
      const registry = await this.RegistryService.registry(registryId);
      const model = new RegistryManagementConfigurationDefaultModel(registry);

      this.registry = registry;
      this.model = model;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve registry details');
    }
  }
}
