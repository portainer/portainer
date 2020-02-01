import _ from 'lodash-es';
import KubernetesResourcePoolViewModel from 'Kubernetes/models/resourcePool';
import KubernetesDefaultLimitRangeModel, {KubernetesPortainerLimitRangeSuffix} from 'Kubernetes/models/limitRange';
import {KubernetesPortainerQuotaSuffix} from 'Kubernetes/models/resourceQuota';

angular.module("portainer.kubernetes").factory("KubernetesResourcePoolService", [
  "$async", "KubernetesNamespaceService", "KubernetesResourceQuotaService", "KubernetesLimitRangeService",
  function KubernetesResourcePoolServiceFactory($async, KubernetesNamespaceService, KubernetesResourceQuotaService, KubernetesLimitRangeService) {
    "use strict";
    const service = {
      resourcePools: resourcePools,
      shortResourcePools: shortResourcePools,
      resourcePool: resourcePool,
      create: create,
      remove: remove
    };

    /**
     * Utility functions
     */

    function bindQuotasToNamespace(pool, namespace, quotas) {
      _.forEach(quotas, (quota) => {
        if (quota.Namespace === namespace.Name) {
          pool.Quotas.push(quota);
        }
      });
    }

    /**
     * Resource pools
     */
    async function resourcePoolsAsync() {
      try {
        const [namespaces, quotas] = await Promise.all([
          KubernetesNamespaceService.namespaces(),
          KubernetesResourceQuotaService.quotas()
        ]);
        const pools = [];
        _.forEach(namespaces, (namespace) => {
          const pool = new KubernetesResourcePoolViewModel(namespace);
          bindQuotasToNamespace(pool, namespace, quotas);
          pools.push(pool);
        });
        return pools;
      } catch (err) {
        throw { msg: 'Unable to retrieve resource pools', err: err };
      }
    }

    function resourcePools() {
      return $async(resourcePoolsAsync);
    }

    /**
     * Short resource pools
     */
    async function shortResourcePoolsAsync() {
      try {
        return await KubernetesNamespaceService.namespaces();
      } catch (err) {
        throw { msg: 'Unable to retrieve resource pools', err: err };
      }
    }

    function shortResourcePools() {
      return $async(shortResourcePoolsAsync);
    }

    async function resourcePoolAsync(name) {
      try {
        const [namespace, quotaAttempt, limitRangeAttempt] = await Promise.allSettled([
          KubernetesNamespaceService.namespace(name),
          KubernetesResourceQuotaService.quota(name, KubernetesPortainerQuotaSuffix + name),
          KubernetesLimitRangeService.limitRange(name, KubernetesPortainerLimitRangeSuffix + name)
        ]);

        let pool = {};
        if (namespace.status === 'fulfilled') {
          pool = new KubernetesResourcePoolViewModel(namespace.value);
          pool.Yaml = namespace.value.Yaml.data;
        }

        if (quotaAttempt.status === 'fulfilled') {
          pool.Quotas.push(quotaAttempt.value);
          pool.Yaml += '---\n' + quotaAttempt.value.Yaml.data;
        }

        if (limitRangeAttempt.status === 'fulfilled') {
          pool.LimitRange = limitRangeAttempt.value;
          pool.Yaml += '---\n' + limitRangeAttempt.value.Yaml.data;
        }

        return pool;
      } catch (err) {
        throw { msg: 'Unable to retrieve resource pool', err: err };
      }
    }

    function resourcePool(name) {
      return $async(resourcePoolAsync, name);
    }

    /**
     * Create resource pool
     */
    async function createAsync(name, hasQuota, cpuLimit, memoryLimit) {
      try {
        await KubernetesNamespaceService.create(name);
        if (hasQuota) {
          await KubernetesResourceQuotaService.create(name, cpuLimit, memoryLimit);
          const limitRange = new KubernetesDefaultLimitRangeModel(name);
          await KubernetesLimitRangeService.create(limitRange, cpuLimit, memoryLimit);
        }
      } catch (err) {
        throw err;
      }
    }

    function create(name, hasQuota, cpuLimit, memoryLimit) {
      return $async(createAsync, name, hasQuota, cpuLimit, memoryLimit);
    }

    /**
     * Remove
     */

    async function removeAsync(pool) {
      try {
        const promises = [KubernetesNamespaceService.remove(pool.Namespace)];
        if (pool.Quotas.length) {
          promises.push(KubernetesResourceQuotaService.removeCollection(pool.Quotas[0]));
        }
        await Promise.all(promises);
      } catch (err) {
        throw { msg: 'Unable to remove resource pool', err: err };
      }
    }

    function remove(pool) {
      return $async(removeAsync, pool);
    }

    return service;
  }
]);
