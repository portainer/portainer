angular.module('portainer.rest')
.factory('Container', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function ContainerFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/containers/:id/:action', {
    name: '@name',
    endpointId: EndpointProvider.endpointID
  },
  {
    query: {method: 'GET', params: {all: 0, action: 'json', filters: '@filters' }, isArray: true},
    get: {method: 'GET', params: {action: 'json'}},
    stop: {method: 'POST', params: {id: '@id', t: 5, action: 'stop'}},
    restart: {method: 'POST', params: {id: '@id', t: 5, action: 'restart'}},
    kill: {method: 'POST', params: {id: '@id', action: 'kill'}},
    pause: {method: 'POST', params: {id: '@id', action: 'pause'}},
    unpause: {method: 'POST', params: {id: '@id', action: 'unpause'}},
    stats: {
      method: 'GET', params: { id: '@id', stream: false, action: 'stats' },
      timeout: 4500
    },
    top: {
      method: 'GET', params: { id: '@id', action: 'top' },
      timeout: 4500
    },
    start: {
      method: 'POST', params: {id: '@id', action: 'start'},
      transformResponse: genericHandler
    },
    create: {
      method: 'POST', params: {action: 'create'},
      transformResponse: genericHandler
    },
    remove: {
      method: 'DELETE', params: {id: '@id', v: '@v', force: '@force'},
      transformResponse: genericHandler
    },
    rename: {
      method: 'POST', params: {id: '@id', action: 'rename', name: '@name'},
      transformResponse: genericHandler
    },
    exec: {
      method: 'POST', params: {id: '@id', action: 'exec'},
      transformResponse: genericHandler
    },
    inspect: {
      method: 'GET', params: { id: '@id', action: 'json' }
    }
  });
}]);
