import _ from "lodash-es";
import KubernetesNamespaceViewModel from "Kubernetes/models/namespace";

angular.module("portainer.kubernetes").factory("KubernetesResourcePoolService", [
  "$async", "KubernetesNamespaces", "KubernetesResourceQuotas",
  function KubernetesResourcePoolServiceFactory($async, KubernetesNamespaces, KubernetesResourceQuotas) {
    "use strict";
    const service = {
      pools: pools  
    };

    async function visibleNamespaces() {
      try {
        const data = await KubernetesNamespaces.query().$promise;
        const namespaces = _.map(data.items, (item) => new KubernetesNamespaceViewModel(item));
        const promises = _.map(namespaces, (item) => KubernetesNamespaces.status({id: item.Name}).$promise);
        const statuses = await Promise.allSettled(promises);
        return statuses;
      } catch (err) {
        throw err;
      }
    }

    async function poolsAsync() {
      void KubernetesResourceQuotas;
      try {
        const namespaces = await visibleNamespaces();
        console.log(namespaces);
      } catch (err) {
        throw { msg: 'Unable to retrieve resource pools', err: err };
      }
    }

    function pools() {
      return $async(poolsAsync);
    }

    return service;
  }
]);
