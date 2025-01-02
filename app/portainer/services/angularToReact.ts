import { EnvironmentId } from '@/react/portainer/environments/types';

import { EndpointProviderInterface } from './endpointProvider';

// see async.js
type AsyncInterface = (
  asyncFunc: AsyncFunction,
  ...args: unknown[]
) => Promise<unknown>;

type AsyncFunction = (...params: unknown[]) => Promise<unknown>;
type AxiosFunction = (
  environmentId: EnvironmentId | undefined,
  ...params: unknown[]
) => Promise<unknown>;

/* @ngInject */
export function AngularToReact(
  EndpointProvider: EndpointProviderInterface,
  $async: AsyncInterface
) {
  return { useAxios, injectEnvironmentId };

  /**
   * Wraps the async axios function with `$async` to ensures the request runs inside the AngularJS digest cycle
   *
   * See `$async` (async.js) implementation and notes
   *
   * See `AngularToReact.injectEnvironmentId` to solve `environmentId` injection for services functions relying
   * on `EndpointProvider.endpointID()` in their `$resource()` definition
   *
   * @example
   * **Old AngularJS service**
   * ```
   * // file:: AngularJS service.js
   *
   * // ngInject
   * function ServiceServiceFactory($q, Service) {
   *   return { getService };
   *
   *   // the original signature doesn't have environmentId passed to it
   *   // it relies on EndpointProvider in $resource() definition
   *   // we will inject it on refactor
   *   // the function uses $q, which internally triggers a redraw of the UI when it resolves/rejects
   *   function getService(serviceId) {
   *     var deferred = $q.defer();
   *     [...]
   *     return deferred.promise;
   *   };
   *
   *   // the original signature has environmentId passed to it
   *   // it doesn't rely on EndpointProvider in $resource() definition
   *   // we won't inject environmentId on refactor
   *   // the function uses $q, which internally triggers a redraw of the UI when it resolves/rejects
   *   function listServices(environmentId) {
   *     var deferred = $q.defer();
   *     [...]
   *     return deferred.promise;
   *   };
   * }
   * ```
   *
   * **New format**
   * ```
   * // file:: '@/react/.../useService.ts'
   * // this function has `environmentId` as first parameter, which doesn't match the old AngularJS service signature
   * export async function getService(environmentId: EnvironmentId, serviceId: ServiceId) {
   *   // axios.get()
   * }
   * // file:: '@/react/.../useServices.ts'
   * // this function has `environmentId` as first parameter, which matches the old AngularJS service signature
   * export async function listServices(environmentId: EnvironmentId, serviceId: ServiceId) {
   *   // axios.get()
   * }
   * // file:: AngularJS service.js
   * import { getService } from '@/react/.../useService.ts';
   * import { listServices } from '@/react/.../useServices.ts';
   *
   * // ngInject
   * function ServiceServiceFactory(AngularToReact) {
   *   const { useAxios, injectEnvironmentId } = AngularToReact;
   *   return {
   *     // ask to inject environmentId to maintain the old signature
   *     getService: useAxios(injectEnvironmentId(getService)),
   *     // do not ask to inject environmentId as it was already in the old signature
   *     // and is already passed by the caller
   *     listServices: useAxios(listServices),
   *   };
   * }
   * ```
   */
  function useAxios(axiosFunc: AxiosFunction) {
    return (...params: unknown[]) =>
      $async(axiosFunc as AsyncFunction, ...params);
  }

  /**
   * Wraps the Axios function taking `endpointId` as first param to expose the old service format.
   *
   * Leverage injected `EndpointProvider` that was used in the rest file - `$resource()` definition.
   *
   * The axios function params **MUST** match the old AngularJS-service ones to use this helper without changing the service calls
   *
   * Should be used in conjunction with `AngularToReact.useAxios`
   *
   * @example
   * See `AngularToReact.useAxios`
   *
   * @param {(environmentId: EnvironmentId, ...params: unknown[]) => Promise<unknown>} axiosFunc Axios function taking `environmentId` as first param
   * @returns a function with the old AngularJS signature
   */
  function injectEnvironmentId(axiosFunc: AxiosFunction) {
    return async (...params: unknown[]) =>
      axiosFunc(EndpointProvider.endpointID(), ...params);
  }
}
