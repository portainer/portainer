import { jsonObjectsToArrayHandler } from './response/handlers';

angular.module('portainer.docker').factory('System', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  'InfoInterceptor',
  'VersionInterceptor',
  function SystemFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, InfoInterceptor, VersionInterceptor) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/:action/:subAction',
      {
        name: '@name',
        endpointId: EndpointProvider.endpointID,
      },
      {
        info: {
          method: 'GET',
          params: { action: 'info' },
          interceptor: InfoInterceptor,
        },
        version: { method: 'GET', params: { action: 'version' }, interceptor: VersionInterceptor },
        events: {
          method: 'GET',
          params: { action: 'events', since: '@since', until: '@until' },
          isArray: true,
          transformResponse: jsonObjectsToArrayHandler,
        },
        auth: { method: 'POST', params: { action: 'auth' } },
        dataUsage: { method: 'GET', params: { action: 'system', subAction: 'df' } },
      }
    );
  },
]);
