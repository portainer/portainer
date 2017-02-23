angular.module('portainer.rest')
.factory('Container', ['$resource', 'Settings', 'EndpointProvider', function ContainerFactory($resource, Settings, EndpointProvider) {
  'use strict';
  return $resource(Settings.url + '/:endpointId/containers/:id/:action', {
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
    changes: {method: 'GET', params: {action: 'changes'}, isArray: true},
    stats: {method: 'GET', params: {id: '@id', stream: false, action: 'stats'}, timeout: 5000},
    start: {
      method: 'POST', params: {id: '@id', action: 'start'},
      transformResponse: genericHandler
    },
    create: {
      method: 'POST', params: {action: 'create'},
      transformResponse: genericHandler
    },
    remove: {
      method: 'DELETE', params: {id: '@id', v: 0},
      transformResponse: genericHandler
    },
    rename: {
      method: 'POST', params: {id: '@id', action: 'rename', name: '@name'},
      transformResponse: genericHandler
    },
    exec: {
      method: 'POST', params: {id: '@id', action: 'exec'},
      transformResponse: genericHandler
    }
  });
}]);
