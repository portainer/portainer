import {KubernetesApplicationStackAnnotationKey} from 'Kubernetes/models/application';

angular.module("portainer.kubernetes").factory("KubernetesPersistentVolumeClaimService", [
  "$async", "KubernetesPersistentVolumeClaims",
  function KubernetesPersistentVolumeClaimServiceFactory($async, KubernetesPersistentVolumeClaims) {
    "use strict";
    const service = {
      create: create,
      remove: remove
    };

    /**
     * Creation
     */
    async function createAsync(claim) {
      try {
        const payload = {
          metadata: {
            name: claim.Name,
            namespace: claim.Namespace,
            annotations: {
              [KubernetesApplicationStackAnnotationKey]: claim.StackName
            }
          },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: {
                storage: claim.Storage
              }
            },
            storageClassName: claim.StorageClass
          }
        };

        const params = {
          id: claim.Name,
        };

        const data = await KubernetesPersistentVolumeClaims(namespace).create(params, payload).$promise;
        return data;
      } catch (err) {
        throw { msg: 'Unable to create persistent volume claim', err: err };
      }
    }

    function create(persistentVolumeClaim) {
      return $async(createAsync, persistentVolumeClaim);
    }

    /**
     * Delete
     */
    async function removeAsync(name, namespace) {
      try {
        // TODO: refactor
        // This is a very strange pattern since only POST requests have a payload
        // I understand this is used to pass the correct parameters to the REST service but it can be confusing
        // Should be taken into account during REST service uniformization/refactor
        // Split into params and payload objects
        const params = {
          namespace: namespace,
          id: name
        };
        await KubernetesPersistentVolumeClaims.delete(params).$promise;
      } catch (err) {
        throw { msg: 'Unable to delete persistent volume claim', err: err };
      }
    }

    function remove(name, namespace) {
      return $async(removeAsync, name, namespace);
    }

    return service;
  }
]);
