import _ from 'lodash';
import { RegistryTypes } from '@/portainer/models/registryTypes';

export default class RegistryController {
  /* @ngInject */
  constructor($scope, $async, $state, RegistryService, Notifications) {
    this.$scope = $scope;
    Object.assign(this, { $async, $state, RegistryService, Notifications });

    this.RegistryTypes = RegistryTypes;

    this.state = {
      actionInProgress: false,
      loading: false,
    };

    this.Password = '';

    this.toggleAuthentication = this.toggleAuthentication.bind(this);
    this.toggleQuayUseOrganisation = this.toggleQuayUseOrganisation.bind(this);
  }

  toggleAuthentication(newValue) {
    this.$scope.$evalAsync(() => {
      this.registry.Authentication = newValue;
    });
  }

  toggleQuayUseOrganisation(newValue) {
    this.$scope.$evalAsync(() => {
      this.registry.Quay.UseOrganisation = newValue;
    });
  }

  passwordLabel() {
    const type = this.registry.Type;
    switch (type) {
      case RegistryTypes.ECR:
        return 'AWS Secret Access Key';
      case RegistryTypes.DOCKERHUB:
        return 'Access token';
      case RegistryTypes.GITLAB:
        return 'Personal Access Token';
      default:
        return 'Password';
    }
  }

  updateRegistry() {
    return this.$async(async () => {
      try {
        this.state.actionInProgress = true;
        const registry = this.registry;
        registry.Password = this.Password;

        await this.RegistryService.updateRegistry(registry);
        this.Notifications.success('Success', 'Registry successfully updated');
        this.$state.go('portainer.registries');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to update registry');
      } finally {
        this.state.actionInProgress = false;
      }
    });
  }

  onChangeName() {
    this.state.nameAlreadyExists = _.includes(this.registriesNames, this.registry.Name);
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

  getRegistryProvider(registryType) {
    switch (registryType) {
      case RegistryTypes.QUAY:
        return 'Quay.io';
      case RegistryTypes.AZURE:
        return 'Azure';
      case RegistryTypes.CUSTOM:
        return 'Custom';
      case RegistryTypes.GITLAB:
        return 'Gitlab';
      case RegistryTypes.PROGET:
        return 'ProGet';
      case RegistryTypes.DOCKERHUB:
        return 'Docker Hub';
      case RegistryTypes.ECR:
        return 'AWS ECR';
      default:
        return '';
    }
  }
  async $onInit() {
    try {
      this.state.loading = true;

      const registryId = this.$state.params.id;
      const registry = await this.RegistryService.registry(registryId);
      this.registry = registry;
      this.provider = this.getRegistryProvider(registry.Type);

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
