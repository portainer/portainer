import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceQuotaDefaults } from 'Kubernetes/models/resourceQuota';

function megaBytesValue(mem) {
  return Math.floor(mem / 1000 / 1000);
}

function bytesValue(mem) {
  return mem * 1000 * 1000;
}

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

  checkDefaults() {
    if (this.formValues.CpuLimit < this.defaults.CpuLimit) {
      this.formValues.CpuLimit = this.defaults.CpuLimit;
    }
    if (this.formValues.MemoryLimit < megaBytesValue(this.defaults.MemoryLimit)) {
        this.formValues.MemoryLimit = megaBytesValue(this.defaults.MemoryLimit);
    }
  }

  async createResourcePoolAsync() {
    this.state.actionInProgress = true;
    try {
      this.checkDefaults();
      await this.KubernetesResourcePoolService.create(this.formValues.Name, this.formValues.hasQuota, this.formValues.CpuLimit, bytesValue(this.formValues.MemoryLimit));
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
      this.defaults = KubernetesResourceQuotaDefaults;

      this.formValues = {
        MemoryLimit: this.defaults.MemoryLimit,
        CpuLimit: this.defaults.CpuLimit,
        hasQuota: false
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
      _.forEach(quotas, (item) => {
        this.state.sliderMaxCpu -= item.CpuLimit;
        this.state.sliderMaxMemory -= item.MemoryLimit;
      });
      this.state.sliderMaxMemory = megaBytesValue(this.state.sliderMaxMemory);
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
