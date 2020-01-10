import _ from "lodash-es";
import KubernetesResourceQuotaViewModel from 'Kubernetes/models/resourceQuota';

angular.module("portainer.kubernetes").factory("KubernetesResourceQuotaService", [
  "$async", "KubernetesResourceQuotas",
  function KubernetesResourceQuotaServiceFactory($async, KubernetesResourceQuotas) {
    "use strict";
    const service = {
      quotas: quotas
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

    return service;
  }
]);
