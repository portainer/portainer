angular.module('portainer.rest')
.factory('Image', ['$resource', 'DOCKER_ENDPOINT', 'EndpointProvider', function ImageFactory($resource, DOCKER_ENDPOINT, EndpointProvider) {
  'use strict';

  function setAuthenticationHeader(requestConfiguration) {
    if (requestConfiguration.params.authenticationDetails !== '') {
      return requestConfiguration.params.authenticationDetails;
    }
  }

  return $resource(DOCKER_ENDPOINT + '/:endpointId/images/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    query: {method: 'GET', params: {all: 0, action: 'json'}, isArray: true},
    get: {method: 'GET', params: {action: 'json'}},
    search: {method: 'GET', params: {action: 'search'}},
    history: {method: 'GET', params: {action: 'history'}, isArray: true},
    insert: {method: 'POST', params: {id: '@id', action: 'insert'}},
    tag: {method: 'POST', params: {id: '@id', action: 'tag', force: 0, repo: '@repo', tag: '@tag'}},
    inspect: {method: 'GET', params: {id: '@id', action: 'json'}},
    push: {
      method: 'POST', params: {action: 'push', id: '@tag'},
      isArray: true, transformResponse: jsonObjectsToArrayHandler
    },
    create: {
      method: 'POST', params: {action: 'create', fromImage: '@fromImage', tag: '@tag'},
      isArray: true, transformResponse: jsonObjectsToArrayHandler,
      headers: { 'X-Registry-Auth': setAuthenticationHeader }
    },
    remove: {
      method: 'DELETE', params: {id: '@id', force: '@force'},
      isArray: true, transformResponse: deleteImageHandler
    }
  });
}]);
