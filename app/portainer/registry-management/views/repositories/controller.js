import _ from 'lodash-es';

import { RegistryTypes } from '@/portainer/registry-management/models/registryTypes';

export class RegistryRepositoriesController {
  /* @ngInject */
  constructor($async, $state, RegistryService, RegistryServiceSelector, Notifications, Authentication) {
    Object.assign(this, { $async, $state, RegistryService, RegistryServiceSelector, Notifications, Authentication });

    this.state = {
      displayInvalidConfigurationMessage: false,
      loading: false,
    };

    this.paginationAction = this.paginationAction.bind(this);
    this.paginationActionAsync = this.paginationActionAsync.bind(this);
    this.$onInit = this.$onInit.bind(this);
  }

  paginationAction(repositories) {
    return this.$async(this.paginationActionAsync, repositories);
  }
  async paginationActionAsync(repositories) {
    if (this.registry.Type === RegistryTypes.GITLAB) {
      return;
    }
    this.state.loading = true;
    try {
      const data = await this.RegistryServiceSelector.getRepositoriesDetails(this.registry, repositories);
      for (let i = 0; i < data.length; i++) {
        const idx = _.findIndex(this.repositories, { Name: data[i].Name });
        if (idx !== -1) {
          if (data[i].TagsCount === 0) {
            this.repositories.splice(idx, 1);
          } else {
            this.repositories[idx].TagsCount = data[i].TagsCount;
          }
        }
      }
      this.state.loading = false;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve repositories details');
    }
  }

  async $onInit() {
    const registryId = this.$state.params.id;

    this.isAdmin = this.Authentication.isAdmin();

    try {
      this.registry = await this.RegistryService.registry(registryId);
      try {
        await this.RegistryServiceSelector.ping(this.registry, false);
        this.repositories = await this.RegistryServiceSelector.repositories(this.registry);
      } catch (e) {
        this.state.displayInvalidConfigurationMessage = true;
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve registry details');
    }
  }
}
