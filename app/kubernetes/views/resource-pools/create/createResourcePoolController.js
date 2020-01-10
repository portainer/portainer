import angular from 'angular';

class KubernetesCreateResourcePoolController {
  /* @ngInject */
  constructor($async, Notifications, KubernetesNodeService, KubernetesResourcePoolService) {
    this.$async = $async;
    this.Notifications = Notifications;

    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;

    this.onInit = this.onInit.bind(this);
    this.createResourcePoolAsync = this.createResourcePoolAsync.bind(this);
  }

  async createResourcePoolAsync() {
    try {
      
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create resource pool');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  createResourcePool() {
    return this.$async(this.createResourcePoolAsync);
  }

  async onInit() {
    try {
      const nodes = await this.KubernetesNodeService.nodes();
      console.log(nodes);
      this.formValues = {
        MemoryLimit: 0,
        CpuLimit: 0
      };

      this.state = {
        actionInProgress: false,
        sliderMaxMemory: 1,
        sliderMaxCpu: 1
      };

    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesCreateResourcePoolController;
angular.module('portainer.kubernetes').controller('KubernetesCreateResourcePoolController', KubernetesCreateResourcePoolController);
