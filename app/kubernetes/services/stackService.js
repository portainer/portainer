import _ from 'lodash-es';
import { KubernetesApplicationStackAnnotationKey } from 'Kubernetes/models/application';

angular.module("portainer.kubernetes").factory('KubernetesStackService', [
  '$async', 'KubernetesDeploymentService', 'KubernetesDaemonSetService',
  function KubernetesStackServiceFactory($async, KubernetesDeploymentService, KubernetesDaemonSetService) {
    const service = {
      stacks: stacks
    };

    /**
     * Stacks
     */
    async function stacksAsync() {
      try {
        const [deployments, daemonSets] = await Promise.all([
          KubernetesDeploymentService.deployments(),
          KubernetesDaemonSetService.daemonSets()
        ]);
        const deploymentStacks = _.map(deployments, (item) => item.metadata.annotations[KubernetesApplicationStackAnnotationKey]);
        const daemonSetStacks = _.map(daemonSets, (item) => item.metadata.annotations[KubernetesApplicationStackAnnotationKey]);
        const stacks = _.concat(deploymentStacks, daemonSetStacks);
        return _.uniq(_.without(stacks, undefined));
      } catch (err) {
        throw err;
      }
    }

    function stacks() {
      return $async(stacksAsync);
    }

    return service;
  }
]);
