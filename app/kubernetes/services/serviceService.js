import {KubernetesApplicationStackAnnotationKey} from 'Kubernetes/models/application';

angular.module("portainer.kubernetes").factory("KubernetesServiceService", [
  "$async", "KubernetesServices",
  function KubernetesServiceServiceFactory($async, KubernetesServices) {
    "use strict";
    const service = {
      services: services,
      create: create,
    };

    /**
     * Services
     */
    async function servicesAsync() {
      try {
        const data = await KubernetesServices.query().$promise;
        return data.items;
      } catch (err) {
        throw { msg: 'Unable to retrieve services', err: err };
      }
    }

    function services() {
      return $async(servicesAsync);
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

        const data = await KubernetesServices.create(payload).$promise;
        return data;
      } catch (err) {
        throw { msg: 'Unable to create service', err:err };
      }
    }

    function create(service) {
      return $async(createAsync, service);
    }

    return service;
  }
]);
