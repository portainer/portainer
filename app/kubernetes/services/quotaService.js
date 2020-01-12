import _ from "lodash-es";
import KubernetesResourceQuotaViewModel from 'Kubernetes/models/resourceQuota';

angular.module("portainer.kubernetes").factory("KubernetesResourceQuotaService", [
  "$async", "KubernetesResourceQuotas",
  function KubernetesResourceQuotaServiceFactory($async, KubernetesResourceQuotas) {
    "use strict";
    const service = {
      quotas: quotas,
      create: create,
      update: update,
      remove: remove
    };

    /**
     * Quotas
     */
    async function quotasAsync() {
      try {
        const data = await KubernetesResourceQuotas.query().$promise;
        const quotas = _.map(data.items, (item) => new KubernetesResourceQuotaViewModel(item));
        return quotas;
      } catch (err) {
        throw { msg: 'Unable to retrieve resource quotas', err: err};
      }
    }

    function quotas() {
      return $async(quotasAsync);
    }

    /**
     * Creation
     */
    async function createAsync(namespace, cpuLimit, memoryLimit) {
      try {
        const payload = {
          metadata: {
            name: namespace
          },
          spec: {
            hard: {
              'limits.cpu': cpuLimit,
              'limits.memory': memoryLimit
            }
          }
        };
        const data = await KubernetesResourceQuotas.create(payload).$promise;
        return data;
      } catch (err) {
        throw { msg: 'Unable to create quota', err:err };
      }
    }

    function create(namespace, cpuLimit, memoryLimit) {
      return $async(createAsync, namespace, cpuLimit, memoryLimit);
    }

    /**
     * Update
     */
    async function updateAsync(quota, cpuLimit, memoryLimit) {
      try {
        quota.spec.hard['limits.cpu'] = cpuLimit;
        quota.spec.hard['limits.memory'] = memoryLimit;
        const data = await KubernetesResourceQuotas.update({}, quota).$promise;
        return new KubernetesResourceQuotaViewModel(data);
      } catch (err) {
        throw { msg: 'Unable to update resource quota', err: err };
      }
    }

    function update(quota, cpuLimit, memoryLimit) {
      return $async(updateAsync, quota, cpuLimit, memoryLimit)
    }

    /**
     * Delete
     */
    async function removeAsync(name) {
      try {
        const payload = {
          namespace: name,
          id: name
        };
        await KubernetesResourceQuotas.delete(payload).$promise;
      } catch (err) {
        throw { msg: 'Unable to delete quota', err: err };
      }
    }

    function remove(name) {
      return $async(removeAsync, name);
    }

    return service;
  }
]);
