import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';

class KubernetesCreateResourcePoolController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesNodeService, KubernetesResourceQuotaService, KubernetesResourcePoolService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;

    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesResourceQuotaService = KubernetesResourceQuotaService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;

    this.onInit = this.onInit.bind(this);
    this.createResourcePoolAsync = this.createResourcePoolAsync.bind(this);
  }

  hasEnoughResources() {
    if (this.state.sliderMaxCpu < this.formValues.CpuLimit || this.state.sliderMaxMemory < this.formValues.MemoryLimit) {
      this.state.displayLowResourceMessage = true;
      return false;
    }
    return true;
  }

  async createResourcePoolAsync() {
    this.state.actionInProgress = true;
    try {
      if (this.formValues.CpuLimit < this.defaults.CpuLimit) {
        this.formValues.CpuLimit = this.defaults.CpuLimit;
      }
      if (this.formValues.MemoryLimit < this.defaults.MemoryLimit) {
          this.formValues.MemoryLimit = this.defaults.MemoryLimit;
      }
      await this.KubernetesResourcePoolService.create(this.formValues.Name, this.formValues.hasQuota, this.formValues.CpuLimit, this.formValues.MemoryLimit);
      this.$state.go('kubernetes.resourcePools');
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
      this.defaults = {
        MemoryLimit: 64000,
        CpuLimit: 1
      };

      this.formValues = {
        MemoryLimit: this.defaults.MemoryLimit,
        CpuLimit: this.defaults.CpuLimit
      };

      this.state = {
        actionInProgress: false,
        sliderMaxMemory: 0,
        sliderMaxCpu: 0
      };

      const [nodes, quotas] = await Promise.all([
        this.KubernetesNodeService.nodes(),
        this.KubernetesResourceQuotaService.quotas()
      ]);

      _.forEach(nodes, (item) => {
        this.state.sliderMaxMemory += filesizeParser(item.Memory);
        this.state.sliderMaxCpu += item.CPU;
      });
      // this.state.sliderMaxMemory = Math.floor(this.state.sliderMaxMemory / 1000 / 1000);
      _.forEach(quotas, (item) => {
        this.state.sliderMaxCpu -= item.CpuLimit;
        this.state.sliderMaxMemory -= item.MemoryLimit;
      });

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
