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
    // TODO: review on architecture/refactor meeting
    // The payload is created in each <Resource>Service
    // We convert the daemonSet model from models/daemonset.js to the payload in here.
    // Wasn't sure if the payload should have been added as a new object in the models/daemonset.js too, with
    // a function to convert a model to a payload.
    // Most of the Kubernetes models are re-used in other objects (container definition is also defined in the deployment
    // model, metadata is the same for all models...) so maybe it should be centralized/defined somewhere.
    // Last discussion on this was to use models for payload and converters (converters location to be determined either
    // in helpers or models).
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
                    image: daemonSet.Image,
                    env: daemonSet.Env
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
