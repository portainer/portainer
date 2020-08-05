import * as _ from 'lodash-es';
import { KubernetesResourceQuota } from 'Kubernetes/models/resource-quota/models';

import angular from 'angular';
import KubernetesResourcePoolConverter from 'Kubernetes/converters/resourcePool';
import KubernetesResourceQuotaHelper from 'Kubernetes/helpers/resourceQuotaHelper';
import { KubernetesNamespace } from 'Kubernetes/models/namespace/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesIngress } from 'Kubernetes/ingress/models';

class KubernetesResourcePoolService {
  /* @ngInject */
  constructor($async, KubernetesNamespaceService, KubernetesResourceQuotaService, KubernetesIngressService) {
    this.$async = $async;
    this.KubernetesNamespaceService = KubernetesNamespaceService;
    this.KubernetesResourceQuotaService = KubernetesResourceQuotaService;
    this.KubernetesIngressService = KubernetesIngressService;

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
      const [quotaAttempt] = await Promise.allSettled([this.KubernetesResourceQuotaService.get(name, KubernetesResourceQuotaHelper.generateResourceQuotaName(name))]);
      const pool = KubernetesResourcePoolConverter.apiToResourcePool(namespace);
      if (quotaAttempt.status === 'fulfilled') {
        pool.Quota = quotaAttempt.value;
        pool.Yaml += '---\n' + quotaAttempt.value.Yaml;
      }
      return pool;
    } catch (err) {
      throw err;
    }
  }

  async getAllAsync() {
    try {
      const namespaces = await this.KubernetesNamespaceService.get();
      const pools = await Promise.all(
        _.map(namespaces, async (namespace) => {
          const name = namespace.Name;
          const [quotaAttempt] = await Promise.allSettled([this.KubernetesResourceQuotaService.get(name, KubernetesResourceQuotaHelper.generateResourceQuotaName(name))]);
          const pool = KubernetesResourcePoolConverter.apiToResourcePool(namespace);
          if (quotaAttempt.status === 'fulfilled') {
            pool.Quota = quotaAttempt.value;
            pool.Yaml += '---\n' + quotaAttempt.value.Yaml;
          }
          return pool;
        })
      );
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
  async createAsync(formValues) {
    try {
      const namespace = new KubernetesNamespace();
      namespace.Name = formValues.Name;
      namespace.ResourcePoolName = formValues.Name;
      namespace.ResourcePoolOwner = formValues.Owner;
      await this.KubernetesNamespaceService.create(namespace);
      if (formValues.HasQuota) {
        const quota = new KubernetesResourceQuota(formValues.Name);
        quota.CpuLimit = formValues.CpuLimit;
        quota.MemoryLimit = KubernetesResourceReservationHelper.bytesValue(formValues.MemoryLimit);
        quota.ResourcePoolName = formValues.Name;
        quota.ResourcePoolOwner = formValues.Owner;
        await this.KubernetesResourceQuotaService.create(quota);
      }
      if (formValues.UseIngress) {
        const ingressPromises = _.map(formValues.IngressClasses, (c) => {
          if (c.Selected) {
            const ingress = new KubernetesIngress();
            ingress.Name = c.Name;
            ingress.Namespace = namespace.Name;
            ingress.IngressClass = c.Name;
            return this.KubernetesIngressService.create(ingress);
          }
        });
        await Promise.all(ingressPromises);
      }
    } catch (err) {
      throw err;
    }
  }

  create(formValues) {
    return this.$async(this.createAsync, formValues);
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
