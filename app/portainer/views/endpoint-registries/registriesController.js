import { RegistryTypes } from 'Portainer/models/registryTypes';

class EndpointRegistriesController {
  /* @ngInject */
  constructor($async, Notifications, EndpointService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;

    this.canManageAccess = this.canManageAccess.bind(this);
  }

  canManageAccess(item) {
    return item.Type !== RegistryTypes.ANONYMOUS;
  }

  getRegistries() {
    return this.$async(async () => {
      try {
        const registries = await this.EndpointService.registries(this.endpointId);
        this.registries = registries;
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
