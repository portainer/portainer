import {KubernetesApplicationStackAnnotationKey} from 'Kubernetes/models/application';

angular.module("portainer.kubernetes").factory("KubernetesDeploymentService", [
  "$async", "KubernetesDeployments",
  function KubernetesDeploymentServiceFactory($async, KubernetesDeployments) {
    "use strict";
    const service = {
      deployments: deployments,
      create: create,
      remove: remove
    };

    /**
     * Deployments
     */
    async function deploymentsAsync() {
      try {
        const data = await KubernetesDeployments.query().$promise;
        return data.items;
      } catch (err) {
        throw { msg: 'Unable to retrieve deployments', err: err };
      }
    }

    function deployments() {
      return $async(deploymentsAsync);
    }

    /**
     * Creation
     */
    async function createAsync(deployment) {
      try {
        const payload = {
          metadata: {
            name: deployment.Name,
            namespace: deployment.Namespace,
            annotations: {
              [KubernetesApplicationStackAnnotationKey]: deployment.StackName
            }
          },
          spec: {
            replicas: deployment.ReplicaCount,
            selector: {
              matchLabels: {
                app: deployment.Name
              }
            },
            template: {
              metadata: {
                labels: {
                  app: deployment.Name
                }
              },
              spec: {
                containers: [
                  {
                    name: deployment.Name,
                    image: deployment.Image,
                    env: deployment.Env,
                    resources: {
                      limits: { }
                    }
                  }
                ]
              }
            }
          }
        };

        if (deployment.MemoryLimit) {
          payload.spec.template.spec.containers[0].resources.limits.memory = deployment.MemoryLimit;
        }
        if (deployment.CpuLimit) {
          payload.spec.template.spec.containers[0].resources.limits.cpu = deployment.CpuLimit;
        }

        const data = await KubernetesDeployments.create(payload).$promise;
        return data;
      } catch (err) {
        throw { msg: 'Unable to create deployment', err:err };
      }
    }

    function create(deployment) {
      return $async(createAsync, deployment);
    }

    /**
     * Delete
     */
    async function removeAsync(deployment) {
      try {
        const payload = {
          namespace: deployment.Namespace,
          name: deployment.Name
        };
        await KubernetesDeployments.delete(payload).$promise
      } catch (err) {
        throw { msg: 'Unable to remove deployment', err: err };
      }
    }

    function remove(deployment) {
      return $async(removeAsync, deployment);
    }

    return service;
  }
]);
