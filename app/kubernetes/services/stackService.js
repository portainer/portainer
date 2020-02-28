import _ from 'lodash-es';

angular.module("portainer.kubernetes").factory('KubernetesStackService', [
  '$async', 'KubernetesApplicationService',
  function KubernetesStackServiceFactory($async, KubernetesApplicationService) {
    const service = {
      stacks: stacks
    };

    /**
     * Stacks
     */
    async function stacksAsync(namespace) {
      try {
        const applications = await KubernetesApplicationService.get(namespace);
        const stacks = _.reduce(applications, (acc, app) => {
          if (app.Stack !== '-' && !_.find(acc, (stack) => stack === app.Stack)) {
            acc.push(app.Stack);
          }
          return acc;
        }, []);
        return stacks;
      } catch (err) {
        throw err;
      }
    }

    function stacks(namespace) {
      return $async(stacksAsync, namespace);
    }

    return service;
  }
]);
