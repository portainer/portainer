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
    async function stacksAsync() {
      try {
        const applications = await KubernetesApplicationService.applications();
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

    function stacks() {
      return $async(stacksAsync);
    }

    return service;
  }
]);
