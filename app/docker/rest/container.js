import { genericHandler, logsHandler } from './response/handlers';

angular.module('portainer.docker').factory('Container', [
  '$resource',
  'API_ENDPOINT_ENDPOINTS',
  'EndpointProvider',
  'ContainersInterceptor',
  function ContainerFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, ContainersInterceptor) {
    'use strict';
    return $resource(
      API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/containers/:id/:action',
      {
        name: '@name',
        endpointId: EndpointProvider.endpointID,
      },
      {
        query: {
          method: 'GET',
          params: { all: 0, action: 'json', filters: '@filters' },
          isArray: true,
          interceptor: ContainersInterceptor,
        },
        get: {
          method: 'GET',
          params: { action: 'json' },
        },
        logs: {
          method: 'GET',
          params: { id: '@id', action: 'logs' },
          ignoreLoadingBar: true,
          transformResponse: logsHandler,
        },
        stats: {
          method: 'GET',
          params: { id: '@id', stream: false, action: 'stats' },
          ignoreLoadingBar: true,
        },
        top: {
          method: 'GET',
          params: { id: '@id', action: 'top' },
          ignoreLoadingBar: true,
        },
        create: {
          method: 'POST',
          params: { action: 'create' },
          transformResponse: genericHandler,
          ignoreLoadingBar: true,
        },
        exec: {
          method: 'POST',
          params: { id: '@id', action: 'exec' },
          transformResponse: genericHandler,
          ignoreLoadingBar: true,
        },
        inspect: {
          method: 'GET',
          params: { id: '@id', action: 'json' },
        },
        update: {
          method: 'POST',
          params: { id: '@id', action: 'update' },
        },
        prune: {
          method: 'POST',
          params: { action: 'prune', filters: '@filters' },
        },
        resize: {
          method: 'POST',
          params: { id: '@id', action: 'resize', h: '@height', w: '@width' },
          transformResponse: genericHandler,
          ignoreLoadingBar: true,
        },
      }
    );
  },
]);
