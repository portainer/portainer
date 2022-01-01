import { logsHandler } from './response/handlers';

angular.module('portainer.docker').factory('Task', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  function TaskFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/tasks/:id/:action',
      {
        endpointId: EndpointProvider.endpointID,
      },
      {
        get: { method: 'GET', params: { id: '@id' } },
        query: { method: 'GET', isArray: true, params: { filters: '@filters' } },
        logs: {
          method: 'GET',
          params: { id: '@id', action: 'logs' },
          ignoreLoadingBar: true,
          transformResponse: logsHandler,
        },
      }
    );
  },
]);
