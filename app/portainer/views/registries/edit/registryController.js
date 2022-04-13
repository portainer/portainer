import _ from 'lodash';
import { RegistryTypes } from '@/portainer/models/registryTypes';

export default class RegistryController {
  /* @ngInject */
  constructor($async, $state, RegistryService, Notifications) {
    Object.assign(this, { $async, $state, RegistryService, Notifications });

    this.RegistryTypes = RegistryTypes;

    this.state = {
      actionInProgress: false,
      loading: false,
    };

    this.formValues = {
      Password: '',
    };
  }

  passwordLabel() {
    const type = this.registry.Type;
    switch (type) {
      case RegistryTypes.ECR:
        return 'AWS Secret Access Key';
      case RegistryTypes.DOCKERHUB:
        return 'Access token';
      default:
        return 'Password';
    }
  }

  updateRegistry() {
    return this.$async(async () => {
      try {
        this.state.actionInProgress = true;
        const registry = this.registry;
        registry.Password = this.formValues.Password;
        registry.Name = this.formValues.Name;

        await this.RegistryService.updateRegistry(registry);
        this.Notifications.success('Registry successfully updated');
        this.$state.go('portainer.registries');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to update registry');
      } finally {
        this.state.actionInProgress = false;
      }
    });
  }

  onChangeName() {
    this.state.nameAlreadyExists = _.includes(this.registriesNames, this.formValues.Name);
  }

  isUpdateButtonDisabled() {
    return (
      this.state.actionInProgress ||
      this.state.nameAlreadyExists ||
      !this.registry.Name ||
      !this.registry.URL ||
      (this.registry.Type == this.RegistryTypes.QUAY && this.registry.Quay.UseOrganisation && !this.registry.Quay.OrganisationName)
    );
  }

  async $onInit() {
    try {
      this.state.loading = true;

      const registryId = this.$state.params.id;
      const registry = await this.RegistryService.registry(registryId);
      this.registry = registry;
      this.formValues.Name = registry.Name;

      const registries = await this.RegistryService.registries();
      _.pullAllBy(registries, [registry], 'Id');
      this.registriesNames = _.map(registries, 'Name');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve registry details');
    } finally {
      this.state.loading = false;
    }
  }
}
