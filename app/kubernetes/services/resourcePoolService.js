import _ from 'lodash-es';
import { KubernetesLimitRange } from 'Kubernetes/models/limit-range/models';
import { KubernetesResourceQuota } from 'Kubernetes/models/resource-quota/models';

import angular from 'angular';
import KubernetesResourcePoolConverter from 'Kubernetes/converters/resourcePool';
import KubernetesLimitRangeHelper from 'Kubernetes/helpers/limitRangeHelper';
import KubernetesResourceQuotaHelper from 'Kubernetes/helpers/resourceQuotaHelper';
import { KubernetesNamespace } from 'Kubernetes/models/namespace/models';

class KubernetesResourcePoolService {
  /* @ngInject */
  constructor($async, KubernetesNamespaceService, KubernetesResourceQuotaService, KubernetesLimitRangeService) {
    this.$async = $async;
    this.KubernetesNamespaceService = KubernetesNamespaceService;
    this.KubernetesResourceQuotaService = KubernetesResourceQuotaService;
    this.KubernetesLimitRangeService = KubernetesLimitRangeService;

    this.getAsync = this.getAsync.bind(this);
    this.getAllAsync = this.getAllAsync.bind(this);
    this.createAsync = this.createAsync.bind(this);
    this.deleteAsync = this.deleteAsync.bind(this);
  }

  /**
   * GET
   */
  async getAsync(name) {
    try {
      const namespace = await this.KubernetesNamespaceService.get(name);
      const [quotaAttempt, limitRangeAttempt] = await Promise.allSettled([
        this.KubernetesResourceQuotaService.get(name, KubernetesResourceQuotaHelper.generateResourceQuotaName(name)),
        this.KubernetesLimitRangeService.get(name, KubernetesLimitRangeHelper.generateLimitRangeName(name))
      ]);

      const pool = KubernetesResourcePoolConverter.apiToResourcePool(namespace);
      if (quotaAttempt.status === 'fulfilled') {
        pool.Quota = quotaAttempt.value;
        pool.Yaml += '---\n' + quotaAttempt.value.Yaml;
      }
      if (limitRangeAttempt.status === 'fulfilled') {
        pool.LimitRange = limitRangeAttempt.value;
        pool.Yaml += '---\n' + limitRangeAttempt.value.Yaml;
      }
      return pool;
    } catch (err) {
      throw err;
    }
  }

  async getAllAsync() {
    try {
      const namespaces = await this.KubernetesNamespaceService.get();
      const promises = _.map(namespaces, (item) => this.getAsync(item.Name));
      const pools = await Promise.all(promises);
      return pools;
    } catch (err) {
      throw err;
    }
  }

  get(name) {
    if (name) {
      return this.$async(this.getAsync, name);
    }
    return this.$async(this.getAllAsync);
  }

  /**
   * CREATE
   */
  // TODO: review LR future
  async createAsync(name, owner, hasQuota, cpuLimit, memoryLimit) {
    try {
      const namespace = new KubernetesNamespace();
      namespace.Name = name;
      namespace.ResourcePoolName = name;
      namespace.ResourcePoolOwner = owner;
      await this.KubernetesNamespaceService.create(namespace);
      if (hasQuota) {
        const quota = new KubernetesResourceQuota(name);
        quota.CpuLimit = cpuLimit;
        quota.MemoryLimit = memoryLimit;
        quota.ResourcePoolName = name;
        quota.ResourcePoolOwner = owner;
        await this.KubernetesResourceQuotaService.create(quota);
        const limitRange = new KubernetesLimitRange(name);
        limitRange.CPU = cpuLimit;
        limitRange.Memory = memoryLimit;
        limitRange.ResourcePoolName = name;
        limitRange.ResourcePoolOwner = owner;
        await this.KubernetesLimitRangeService.create(limitRange);
      }
    } catch (err) {
      throw err;
    }
  }

  create(name, owner, hasQuota, cpuLimit, memoryLimit) {
    return this.$async(this.createAsync, name, owner, hasQuota, cpuLimit, memoryLimit);
  }

  /**
   * DELETE
   */
  async deleteAsync(pool) {
    try {
      await this.KubernetesNamespaceService.delete(pool.Namespace);
    } catch (err) {
      throw err;
    }
  }

  delete(pool) {
    return this.$async(this.deleteAsync, pool);
  }
}

export default KubernetesResourcePoolService;
angular.module('portainer.kubernetes').service('KubernetesResourcePoolService', KubernetesResourcePoolService);
