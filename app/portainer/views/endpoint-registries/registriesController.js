import _ from 'lodash-es';
import { DockerHubViewModel } from 'Portainer/models/dockerhub';
import { RegistryTypes } from 'Portainer/models/registryTypes';

class EndpointRegistriesController {
  /* @ngInject */
  constructor($async, Notifications, RegistryService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.RegistryService = RegistryService;

    this.canManageAccess = this.canManageAccess.bind(this);
  }

  canManageAccess(item) {
    return item.Type !== RegistryTypes.ANONYMOUS;
  }

  getRegistries() {
    return this.$async(async () => {
      try {
        const dockerhub = new DockerHubViewModel();
        const registries = await this.RegistryService.registries();
        this.registries = _.concat(registries, dockerhub);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve registries');
      }
    });
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        viewReady: false,
      };

      try {
        this.endpointType = this.endpoint.Type;
        this.endpointId = this.endpoint.Id;
        await this.getRegistries();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve registries');
      } finally {
        this.state.viewReady = true;
      }
    });
  }
}

export default EndpointRegistriesController;
angular.module('portainer.app').controller('EndpointRegistriesController', EndpointRegistriesController);
