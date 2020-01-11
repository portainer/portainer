import _ from "lodash-es";
import KubernetesResourceQuotaViewModel from 'Kubernetes/models/resourceQuota';

angular.module("portainer.kubernetes").factory("KubernetesResourceQuotaService", [
  "$async", "KubernetesResourceQuotas",
  function KubernetesResourceQuotaServiceFactory($async, KubernetesResourceQuotas) {
    "use strict";
    const service = {
      quotas: quotas,
      create: create
    };

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

    return service;
  }
]);
