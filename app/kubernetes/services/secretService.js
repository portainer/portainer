import {KubernetesApplicationStackAnnotationKey} from 'Kubernetes/models/application/models';

angular.module("portainer.kubernetes").factory("KubernetesSecretService", [
  "$async", "KubernetesSecrets",
  function KubernetesSecretServiceFactory($async, KubernetesSecrets) {
    "use strict";
    const service = {
      create: create,
    };

    /**
     * Creation
     */
    async function createAsync(secret) {
      try {
        const payload = {
          metadata: {
            name: secret.Name,
            namespace: secret.Namespace,
            annotations: {
              [KubernetesApplicationStackAnnotationKey]: secret.StackName
            }
          },
          type: secret.Type,
          data: secret.Data
        };

        const data = await KubernetesSecrets(payload.metadata.namespace).create(payload).$promise;
        return data;
      } catch (err) {
        throw { msg: 'Unable to create secret', err: err };
      }
    }

    function create(secret) {
      return $async(createAsync, secret);
    }

    return service;
  }
]);
