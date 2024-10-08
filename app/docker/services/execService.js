import { resizeTTY } from '@/react/docker/proxy/queries/useExecResizeTTYMutation';

angular.module('portainer.docker').factory('ExecService', ExecServiceFactory);

/* @ngInject */
function ExecServiceFactory(AngularToReact) {
  const { useAxios, injectEnvironmentId } = AngularToReact;

  return {
    resizeTTY: useAxios(injectEnvironmentId(resizeTTYAngularJS)),
  };

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {string} execId
   * @param {number} width
   * @param {number} height
   * @param timeout DEPRECATED: Previously used in pure AJS implementation
   */
  async function resizeTTYAngularJS(environmentId, execId, width, height) {
    return resizeTTY(environmentId, execId, { width, height });
  }
}
