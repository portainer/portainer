import {genericHandler, logsHandler} from './response/handlers';

angular.module('portainer.docker')
.factory('Container', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', 'ContainersInterceptor',
function ContainerFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, ContainersInterceptor) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/containers/:id/:action', {
    name: '@name',
    endpointId: EndpointProvider.endpointID
  },
  {
    query: {
      method: 'GET', params: { all: 0, action: 'json', filters: '@filters' },
      isArray: true, interceptor: ContainersInterceptor, timeout: 15000
    },
    get: {
      method: 'GET', params: { action: 'json' }
    },
    stop: {
      method: 'POST', params: { id: '@id', action: 'stop' }
    },
    restart: {
      method: 'POST', params: { id: '@id', action: 'restart' }
    },
    kill: {
      method: 'POST', params: { id: '@id', action: 'kill' }
    },
    pause: {
      method: 'POST', params: { id: '@id', action: 'pause' }
    },
    unpause: {
      method: 'POST', params: { id: '@id', action: 'unpause' }
    },
    logs: {
      method: 'GET', params: { id: '@id', action: 'logs' },
      timeout: 4500, ignoreLoadingBar: true,
      transformResponse: logsHandler
    },
    stats: {
      method: 'GET', params: { id: '@id', stream: false, action: 'stats' },
      timeout: 4500, ignoreLoadingBar: true
    },
    top: {
      method: 'GET', params: { id: '@id', action: 'top' },
      timeout: 4500, ignoreLoadingBar: true
    },
    start: {
      method: 'POST', params: {id: '@id', action: 'start'},
      transformResponse: genericHandler
    },
    create: {
      method: 'POST', params: {action: 'create'},
      transformResponse: genericHandler,
      ignoreLoadingBar: true
    },
    remove: {
      method: 'DELETE', params: {id: '@id', v: '@v', force: '@force'},
      transformResponse: genericHandler
    },
    rename: {
      method: 'POST', params: { id: '@id', action: 'rename', name: '@name' },
      transformResponse: genericHandler
    },
    exec: {
      method: 'POST', params: {id: '@id', action: 'exec'},
      transformResponse: genericHandler, ignoreLoadingBar: true
    },
    inspect: {
      method: 'GET', params: { id: '@id', action: 'json' }
    },
    update: {
      method: 'POST', params: { id: '@id', action: 'update'}
    },
    prune: {
      method: 'POST', params: { action: 'prune', filters: '@filters' }
    },
    resize: {
      method: 'POST', params: {id: '@id', action: 'resize', h: '@height', w: '@width'},
      transformResponse: genericHandler, ignoreLoadingBar: true
    }
  });
}]);
