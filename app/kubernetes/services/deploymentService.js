import {KubernetesApplicationStackAnnotationKey} from 'Kubernetes/models/application';

angular.module("portainer.kubernetes").factory("KubernetesDeploymentService", [
  "$async", "KubernetesDeployments",
  function KubernetesDeploymentServiceFactory($async, KubernetesDeployments) {
    "use strict";
    const service = {
      deployments: deployments,
      create: create,
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
                    env: deployment.Env
                  }
                ]
              }
            }
          }
        };

        const data = await KubernetesDeployments.create(payload).$promise;
        return data;
      } catch (err) {
        throw { msg: 'Unable to create deployment', err:err };
      }
    }

    function create(deployment) {
      return $async(createAsync, deployment);
    }

    return service;
  }
]);
