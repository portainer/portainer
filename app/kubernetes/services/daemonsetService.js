import {KubernetesApplicationStackAnnotationKey} from 'Kubernetes/models/application';

angular.module("portainer.kubernetes").factory("KubernetesDaemonSetService", [
  "$async", "KubernetesDaemonSets",
  function KubernetesDaemonSetServiceFactory($async, KubernetesDaemonSets) {
    "use strict";
    const service = {
      create: create,
    };

    /**
     * Creation
     */
    // TODO: review @LP
    // The payload is created in each <Resource>Service
    // We convert the daemonSet model from models/daemonset.js to the payload in here.
    // Wasn't sure if the payload should have been added as a new object in the models/daemonset.js too, with
    // a function to convert a model to a payload. But it kinda make sense to keep this here in the rest/ folder.
    async function createAsync(daemonSet) {
      try {
        const payload = {
          metadata: {
            name: daemonSet.Name,
            namespace: daemonSet.Namespace,
            annotations: {
              [KubernetesApplicationStackAnnotationKey]: daemonSet.StackName
            }
          },
          spec: {
            replicas: daemonSet.ReplicaCount,
            selector: {
              matchLabels: {
                app: daemonSet.Name
              }
            },
            template: {
              metadata: {
                labels: {
                  app: daemonSet.Name
                }
              },
              spec: {
                containers: [
                  {
                    name: daemonSet.Name,
                    image: daemonSet.Image
                  }
                ]
              }
            }
          }
        };

        const data = await KubernetesDaemonSets.create(payload).$promise;
        return data;
      } catch (err) {
        throw { msg: 'Unable to create daemon set', err:err };
      }
    }

    function create(daemonSet) {
      return $async(createAsync, daemonSet);
    }

    return service;
  }
]);
