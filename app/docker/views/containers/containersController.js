import angular from 'angular';

class ContainersController {
  /* @ngInject */
  constructor(ContainerService, Notifications, EndpointProvider) {
    this.ContainerService = ContainerService;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.offlineMode = false;
  }

  async $onInit() {
    try {
      let data = await this.ContainerService.containers(1);
      this.containers = data;
      this.offlineMode = this.EndpointProvider.offlineMode();
    }
    catch(err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve containers');
      this.containers = [];
    }
  }
}

export default ContainersController;
angular.module('portainer.docker').controller('ContainersController', ContainersController);
