import {KubernetesApplicationStackAnnotationKey} from 'Kubernetes/models/application';

angular.module("portainer.kubernetes").factory("KubernetesDeploymentService", [
  "$async", "KubernetesDeployments",
  function KubernetesDeploymentServiceFactory($async, KubernetesDeployments) {
    "use strict";
    const factory = {
      deployments: deployments,
      deployment: deployment,
      create: create,
      remove: remove
    };

    /**
     * Deployments
     */
    async function deploymentsAsync() {
      try {
        const data = await KubernetesDeployments().query().$promise;
        return data.items;
      } catch (err) {
        throw { msg: 'Unable to retrieve deployments', err: err };
      }
    }

    function deployments() {
      return $async(deploymentsAsync);
    }

    /**
     * Deployment
     */
    async function deploymentAsync(namespace, name) {
      try {
        const payload = {
          id: name
        };
        const [raw, yaml] = await Promise.all([
          KubernetesDeployments(namespace).get(payload).$promise,
          KubernetesDeployments(namespace).getYaml(payload).$promise
        ]);
        const res = {
          Raw: raw,
          Yaml: yaml
        }
        return res;
      } catch (err) {
        throw { msg: 'Unable to retrieve deployment', err: err };
      }
    }

    function deployment(namespace, name) {
      return $async(deploymentAsync, namespace, name);
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

        const data = await KubernetesDeployments(payload.metadata.namespace).create(payload).$promise;
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
          name: deployment.Name
        };
        await KubernetesDeployments(deployment.Namespace).delete(payload).$promise
      } catch (err) {
        throw { msg: 'Unable to remove deployment', err: err };
      }
    }

    function remove(deployment) {
      return $async(removeAsync, deployment);
    }

    return factory;
  }
]);
