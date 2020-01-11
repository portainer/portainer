import _ from "lodash-es";
import KubernetesResourcePoolViewModel from "Kubernetes/models/resourcePool";

angular.module("portainer.kubernetes").factory("KubernetesResourcePoolService", [
  "$async", 'KubernetesNamespaceService', 'KubernetesResourceQuotaService',
  function KubernetesResourcePoolServiceFactory($async, KubernetesNamespaceService, KubernetesResourceQuotaService) {
    "use strict";
    const service = {
      resourcePools: resourcePools,
      shortResourcePools: shortResourcePools,
      create: create
    };

    /**
     * Resource pools
     */
    async function resourcePoolsAsync() {
      try {
        const namespaces = await KubernetesNamespaceService.namespaces();
        const quotas = await KubernetesResourceQuotaService.quotas();
        const pools = [];
        _.forEach(namespaces, (namespace) => {
          const pool = new KubernetesResourcePoolViewModel(namespace);
          _.forEach(quotas, (quota) => {
            if (quota.Namespace === namespace.Name) {
              pool.Quotas.push(quota);
            }
          });
          pools.push(pool);
        })
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

    /**
     * Create resource pool
     */
    async function createAsync(name, hasQuota, cpuLimit, memoryLimit) {
      try {
        await KubernetesNamespaceService.create(name);
        if (hasQuota) {
          await KubernetesResourceQuotaService.create(name, cpuLimit, memoryLimit);
        }
      } catch (err) {
        throw { msg: 'Unable to create resource pool' };
      }
    }

    function create(name, hasQuota, cpuLimit, memoryLimit) {
      return $async(createAsync, name, hasQuota, cpuLimit, memoryLimit);
    }

    return service;
  }
]);
