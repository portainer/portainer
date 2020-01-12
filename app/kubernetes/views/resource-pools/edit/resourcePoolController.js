import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceQuotaDefaults } from 'Kubernetes/models/resourceQuota';

/**
 * IMPORTANT NOTICE
 * This view assumes that only 1 quota can exist at a time in the resource pool (1 quota per namespace)
 * Modifying the quota here will only modify the first quota of the list returned by Kubernetes API, regarding of its name or list order
 * 
 * TODO: this view needs a refactor to allow users working with multiple quotas inside the same namespace
 */

function megaBytesValue(mem) {
  return Math.floor(mem / 1000 / 1000);
}

function bytesValue(mem) {
  return mem * 1000 * 1000;
}

class KubernetesEditResourcePoolController {
  /* @ngInject */
  constructor($async, $state, $stateParams, Notifications, KubernetesNodeService, KubernetesResourceQuotaService, KubernetesResourcePoolService) {
    this.$async = $async;
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.Notifications = Notifications;

    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesResourceQuotaService = KubernetesResourceQuotaService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;

    this.onInit = this.onInit.bind(this);
    this.updateResourcePoolAsync = this.updateResourcePoolAsync.bind(this);
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

  async updateResourcePoolAsync() {
    this.state.actionInProgress = true;
    const memoryLimit = bytesValue(this.formValues.MemoryLimit);
    try {
      this.checkDefaults(); 
      if (this.formValues.hasQuota) {
        if (this.pool.Quotas.length) {
          await this.KubernetesResourceQuotaService.update(this.pool.Quotas[0].Raw, this.formValues.CpuLimit, memoryLimit);
        } else {
          await this.KubernetesResourceQuotaService.create(this.pool.Namespace.Name, this.formValues.CpuLimit, memoryLimit);
        }
      } else if (this.pool.Quotas.length) {
        await this.KubernetesResourceQuotaService.remove(this.pool.Namespace.Name);
      }
      this.Notifications.success('Resource pool successfully updated', this.pool.Namespace.Name);
      this.$state.reload();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create resource pool');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  updateResourcePool() {
    return this.$async(this.updateResourcePoolAsync);
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

      const name = this.$stateParams.id;

      const [nodes, quotas, pool] = await Promise.all([
        this.KubernetesNodeService.nodes(),
        this.KubernetesResourceQuotaService.quotas(),
        this.KubernetesResourcePoolService.resourcePool(name)
      ]);

      this.pool = pool;

      _.forEach(nodes, (item) => {
        this.state.sliderMaxMemory += filesizeParser(item.Memory);
        this.state.sliderMaxCpu += item.CPU;
      });
      _.forEach(quotas, (item) => {
        this.state.sliderMaxCpu -= item.CpuLimit;
        this.state.sliderMaxMemory -= item.MemoryLimit;
      });

      if (pool.Quotas.length) {
        let cpuLimit = 0;
        let memoryLimit = 0;
        this.formValues.hasQuota = true;
        _.forEach(pool.Quotas, (item) => {
          this.state.sliderMaxCpu += item.CpuLimit;
          this.state.sliderMaxMemory += item.MemoryLimit;
          cpuLimit += item.CpuLimit;
          memoryLimit += item.MemoryLimit;
        });
        this.formValues.CpuLimit = cpuLimit;
        this.formValues.MemoryLimit = memoryLimit;
        this.formValues.MemoryLimit = megaBytesValue(this.formValues.MemoryLimit);
      }
      this.state.sliderMaxMemory = megaBytesValue(this.state.sliderMaxMemory);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesEditResourcePoolController;
angular.module('portainer.kubernetes').controller('KubernetesEditResourcePoolController', KubernetesEditResourcePoolController);
