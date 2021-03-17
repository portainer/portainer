import { RegistryViewModel } from '../../../../portainer/models/registry';

class DockerRegistryAccessController {
  /* @ngInject */
  constructor($async, Notifications, EndpointProvider, RegistryService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.RegistryService = RegistryService;
  }

  $onInit() {
    return this.$async(async () => {
      try {
        this.state = {
          actionInProgress: false,
        };

        const endpointId = this.EndpointProvider.currentEndpoint().Id;
        const registry = await this.RegistryService.registry(endpointId, this.$transition$.params().id);
        this.registry = new RegistryViewModel(registry);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve registry details');
      } finally {
        this.state.viewReady = true;
      }
    });
  }
}

export default DockerRegistryAccessController;
angular.module('portainer.docker').controller('DockerRegistryAccessController', DockerRegistryAccessController);
