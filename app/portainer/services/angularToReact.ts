import { EnvironmentId } from '@/react/portainer/environments/types';

import { EndpointProviderInterface } from './endpointProvider';

/* @ngInject */
export function AngularToReact(EndpointProvider: EndpointProviderInterface) {
  return { useAxios };

  /**
   * Wraps the Axios function taking `endpointId` as first param to expose the old service format.
   *
   * Leverage injected `EndpointProvider` that was used in the rest file - `$resource()` definition.
   *
   * The axios function params **MUST** match the old AngularJS-service ones to use this helper without changing the service calls
   *
   * @example
   * **Old AngularJS service**
   * ```
   * // file:: AngularJS service.js
   *
   * // ngInject
   * function ServiceServiceFactory($q, Service) {
   *  return { getService };
   *
   *  function getService(id) { // id param is the serviceId
   *   var deferred = $q.defer();
   *   [...]
   *   return deferred.promise;
   *  };
   * }
   * ```
   *
   * **New format**
   * ```
   * // file:: AngularJS service.js
   * import { getService } from '@/react/.../useService.ts';
   *
   * // ngInject
   * function ServiceServiceFactory(AngularToReact) {
   *  return {
   *   getService: AngularToReact.useAxios(getService),
   *  };
   * }
   *
   * // file:: '@/react/.../useService.ts'
   *
   * export async function getService(environmentId: EnvironmentId, serviceId: ServiceId) {
   *   // axios.get()
   * }
   * ```
   * @param {(endpointId: EnvironmentId, ...params: unknown[]) => Promise<unknown>} axiosFunc Axios function taking `endpointId` as first param
   * @returns function of the old AngularJS format that doesn't take `endpointId` as first param.
   */
  function useAxios(
    axiosFunc: (
      endpointId: EnvironmentId | undefined,
      ...params: unknown[]
    ) => Promise<unknown>
  ) {
    return async (...params: unknown[]) =>
      axiosFunc(EndpointProvider.endpointID(), ...params);
  }
}
