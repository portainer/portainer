import angular from 'angular';

class KubernetesCreateVolumeController {
  /* @ngInject */
  constructor($async, $state, Notifications) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;

    this.onInit = this.onInit.bind(this);
  }

  isCreateButtonDisabled() {
    const noStorage = !this.storages || this.storages.length === 0;

    return noStorage;
  }

  async onInit() {
    try {
      this.state = {
        viewReady: false,
        availableSizeUnits: ['MB', 'GB', 'TB'],
      };
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    } finally {
      this.state.viewReady = true;
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesCreateVolumeController;
angular.module('portainer.kubernetes').controller('KubernetesCreateVolumeController', KubernetesCreateVolumeController);
