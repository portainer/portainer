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
        const data = await KubernetesDaemonSets(namespace).get().$promise;
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
    // TODO: refactor try an approach on a small service/model for resource pools
    // Find a way to create view/payload models with converters
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
                      limits: {},
                      requests: {}
                    },
                    volumeMounts: daemonSet.VolumeMounts
                  }
                ],
                volumes: daemonSet.Volumes
              }
            }
          }
        };

        if (daemonSet.MemoryLimit) {
          payload.spec.template.spec.containers[0].resources.limits.memory = daemonSet.MemoryLimit;
          payload.spec.template.spec.containers[0].resources.requests.memory = 0;
        }
        if (daemonSet.CpuLimit) {
          payload.spec.template.spec.containers[0].resources.limits.cpu = daemonSet.CpuLimit;
          payload.spec.template.spec.containers[0].resources.requests.cpu = 0;
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
