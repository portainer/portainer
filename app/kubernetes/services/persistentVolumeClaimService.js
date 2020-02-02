import {KubernetesApplicationStackAnnotationKey} from 'Kubernetes/models/application';

angular.module("portainer.kubernetes").factory("KubernetesPersistentVolumeClaimService", [
  "$async", "KubernetesPersistentVolumeClaims",
  function KubernetesPersistentVolumeClaimServiceFactory($async, KubernetesPersistentVolumeClaims) {
    "use strict";
    const service = {
      create: create,
    };

    // apiVersion: v1
// kind: PersistentVolumeClaim
// metadata:
//   name: csi-pvc
// spec:
//   accessModes:
//     - ReadWriteOnce
// resources:
//   requests:
//     storage: 5Gi
// storageClassName: do-block-storage

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

        const data = await KubernetesPersistentVolumeClaims.create(payload).$promise;
        return data;
      } catch (err) {
        throw { msg: 'Unable to create persistent volume claim', err: err };
      }
    }

    function create(persistentVolumeClaim) {
      return $async(createAsync, persistentVolumeClaim);
    }

    return service;
  }
]);
