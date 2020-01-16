import {KubernetesApplicationStackAnnotationKey} from 'Kubernetes/models/application';

angular.module("portainer.kubernetes").factory("KubernetesDaemonSetService", [
  "$async", "KubernetesDaemonSets",
  function KubernetesDaemonSetServiceFactory($async, KubernetesDaemonSets) {
    "use strict";
    const factory = {
      daemonSets: daemonSets,
      daemonSet: daemonSet,
      create: create,
      remove: remove
    };

    /**
     * DaemonSets
     */
    async function daemonSetsAsync(namespace) {
      try {
        const data = await KubernetesDaemonSets(namespace).query().$promise;
        return data.items;
      } catch (err) {
        throw { msg: 'Unable to retrieve DaemonSets', err: err };
      }
    }

    function daemonSets(namespace) {
      return $async(daemonSetsAsync, namespace);
    }

    /**
     * daemonSet
     */
    async function daemonSetAsync(namespace, name) {
      try {
        const payload = {
          id: name
        };
        const [raw, yaml] = await Promise.all([
          KubernetesDaemonSets(namespace).get(payload).$promise,
          KubernetesDaemonSets(namespace).getYaml(payload).$promise
        ]);
        const res = {
          Raw: raw,
          Yaml: yaml
        };
        return res;
      } catch (err) {
        throw { msg: 'Unable to retrieve daemonSet', err: err };
      }
    }

    function daemonSet(namespace, name) {
      return $async(daemonSetAsync, namespace, name);
    }

    /**
     * Creation
     */
    // TODO: review on architecture/refactor meeting
    // The payload is created in each <Resource>Service
    // We convert the daemonSet model from models/daemonset.js to the payload in here.
    // Wasn't sure if the payload should have been added as a new object in the models/daemonset.js too, with
    // a function to convert a model to a payload.
    // Most of the Kubernetes models are re-used in other objects (container definition is also defined in the daemonSet
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
                    env: daemonSet.Env,
                    resources: {
                      limits: { }
                    }
                  }
                ]
              }
            }
          }
        };

        if (daemonSet.MemoryLimit) {
          payload.spec.template.spec.containers[0].resources.limits.memory = daemonSet.MemoryLimit;
        }
        if (daemonSet.CpuLimit) {
          payload.spec.template.spec.containers[0].resources.limits.cpu = daemonSet.CpuLimit;
        }

        const data = await KubernetesDaemonSets(payload.metadata.namespace).create(payload).$promise;
        return data;
      } catch (err) {
        throw { msg: 'Unable to create daemon set', err:err };
      }
    }

    function create(daemonSet) {
      return $async(createAsync, daemonSet);
    }

    /**
     * Delete
     */
    async function removeAsync(daemonSet) {
      try {
        const payload = {
          id: daemonSet.Name
        };
        await KubernetesDaemonSets(daemonSet.Namespace).delete(payload).$promise
      } catch (err) {
        throw { msg: 'Unable to remove daemonset', err: err };
      }
    }

    function remove(daemonSet) {
      return $async(removeAsync, daemonSet);
    }

    return factory;
  }
]);
