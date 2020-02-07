import _ from 'lodash-es';
import KubernetesNamespaceViewModel from 'Kubernetes/models/namespace';

angular.module("portainer.kubernetes").factory("KubernetesNamespaceService", [
  "$async", "KubernetesNamespaces",
  function KubernetesNamespaceServiceFactory($async, KubernetesNamespaces) {
    "use strict";
    const service = {
      namespaces: namespaces,
      namespace: namespace,
      create: create,
      remove: remove
    };

    /**
     * Namespaces
     */
    async function namespacesAsync() {
      try {
        const data = await KubernetesNamespaces().get().$promise;
        const namespaces = _.map(data.items, (item) => item.metadata.name);
        const promises = _.map(namespaces, (item) => KubernetesNamespaces().status({id: item}).$promise);
        const statuses = await Promise.allSettled(promises);
        const visibleNamespaces = _.reduce(statuses, (result, item) => {
          if (item.status === 'fulfilled' && item.value.status.phase !== 'Terminating') {
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
        const payload = {
          id: name
        };
        await KubernetesNamespaces().status({id: name}).$promise;
        const [raw, yaml] = await Promise.all([
          KubernetesNamespaces().get(payload).$promise,
          KubernetesNamespaces().getYaml(payload).$promise
        ]);
        const namespace = new KubernetesNamespaceViewModel(raw);
        namespace.Yaml = yaml;
        return namespace;
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
        const data = await KubernetesNamespaces().create(payload).$promise
        return data;
      } catch (err) {
        throw { msg: 'Unable to create namespace', err: err };
      }
    }

    function create(name) {
      return $async(createAsync, name);
    }

    /**
     * Delete
     */
    async function removeAsync(namespace) {
      try {
        const payload = {
          id: namespace.Name
        };
        await KubernetesNamespaces().delete(payload).$promise
      } catch (err) {
        throw { msg: 'Unable to delete namespace', err: err };
      }
    }

    function remove(namespace) {
      return $async(removeAsync, namespace);
    }

    return service;
  }
]);
