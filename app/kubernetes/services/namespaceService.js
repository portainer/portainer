import _ from "lodash-es";
import KubernetesNamespaceViewModel from "Kubernetes/models/namespace";

angular.module("portainer.kubernetes").factory("KubernetesNamespaceService", [
  "$async", "KubernetesNamespaces",
  function KubernetesNamespaceServiceFactory($async, KubernetesNamespaces) {
    "use strict";
    const service = {
      namespaces: namespaces,
      namespace: namespace,
      create: create
    };

    /**
     * Namespaces
     */
    async function namespacesAsync() {
      try {
        const data = await KubernetesNamespaces.query().$promise;
        const namespaces = _.map(data.items, (item) => item.metadata.name);
        const promises = _.map(namespaces, (item) => KubernetesNamespaces.status({id: item}).$promise);
        const statuses = await Promise.allSettled(promises);
        const visibleNamespaces = _.reduce(statuses, (result, item) => {
          if (item.status === 'fulfilled') {
            result.push(new KubernetesNamespaceViewModel(item.value));
          }
          return result
        }, []);
        return visibleNamespaces;
      } catch (err) {
        throw { msg: 'Unable to retrieve namespaces', err: err };
      }
    }

    function namespaces() {
      return $async(namespacesAsync);
    }

    /**
     * Namespace
     */
    async function namespaceAsync(name) {
      try {
        const data = await KubernetesNamespaces.query({id: name}).$promise;
        return new KubernetesNamespaceViewModel(data);
      } catch (err) {
        throw { msg: 'Unable to retrieve namespace', err: err };
      }
    }

    function namespace(name) {
      return $async(namespaceAsync, name);
    }


    /**
     * Create
     */
    async function createAsync(name) {
      try {
        const payload = {
          metadata: {
            name: name
          }
        };
        const data = await KubernetesNamespaces.create(payload).$promise
        return data;
      } catch (err) {
        throw { msg: 'Unable to create namespace', err: err };
      }
    }

    function create(name) {
      return $async(createAsync, name);
    }

    return service;
  }
]);
