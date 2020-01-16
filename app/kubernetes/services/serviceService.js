import {KubernetesApplicationStackAnnotationKey} from 'Kubernetes/models/application';

angular.module("portainer.kubernetes").factory("KubernetesServiceService", [
  "$async", "KubernetesServices",
  function KubernetesServiceServiceFactory($async, KubernetesServices) {
    "use strict";
    const factory = {
      services: services,
      service: service,
      create: create,
      remove: remove
    };

    /**
     * Services
     */
    async function servicesAsync(namespace) {
      try {
        const data = await KubernetesServices(namespace).query().$promise;
        return data.items;
      } catch (err) {
        throw { msg: 'Unable to retrieve services', err: err };
      }
    }

    function services(namespace) {
      return $async(servicesAsync, namespace);
    }

    /**
     * Service
     */
    async function serviceAsync(namespace, name) {
      try {
        const payload = {
          id: name
        };
        const [raw, yaml] = await Promise.all([
          KubernetesServices(namespace).get(payload).$promise,
          KubernetesServices(namespace).getYaml(payload).$promise
        ]);
        const res = {
          Raw: raw,
          Yaml: yaml
        }
        return res;
      } catch (err) {
        throw { msg: 'Unable to retrieve service', err: err };
      }
    }

    function service(namespace, name) {
      return $async(serviceAsync, namespace, name);
    }

    /**
     * Creation
     */
    async function createAsync(service) {
      try {
        const payload = {
          metadata: {
            name: service.Name,
            namespace: service.Namespace,
            annotations: {
              [KubernetesApplicationStackAnnotationKey]: service.StackName
            }
          },
          spec: {
            ports: service.Ports,
            selector: {
              app: service.Name,
            },
          }
        };

        if (service.Type) {
          payload.spec.type = service.Type;
        }

        const data = await KubernetesServices(payload.metadata.namespace).create(payload).$promise;
        return data;
      } catch (err) {
        throw { msg: 'Unable to create service', err:err };
      }
    }

    function create(service) {
      return $async(createAsync, service);
    }

    /**
     * Delete
     */
    async function removeAsync(service) {
      try {
        const payload = {
          id: service.Name
        };
        await KubernetesServices(service.Namespace).delete(payload).$promise
      } catch (err) {
        throw { msg: 'Unable to remove service', err: err };
      }
    }

    function remove(service) {
      return $async(removeAsync, service);
    }

    return factory;
  }
]);
