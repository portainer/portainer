angular.module('portainer.docker')
.factory('Image', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', 'HttpRequestHelper',
function ImageFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider, HttpRequestHelper) {
  'use strict';

  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/images/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    query: {method: 'GET', params: {all: 0, action: 'json'}, isArray: true},
    get: {method: 'GET', params: {action: 'json'}},
    search: {method: 'GET', params: {action: 'search'}},
    history: {method: 'GET', params: {action: 'history'}, isArray: true},
    insert: {method: 'POST', params: {id: '@id', action: 'insert'}},
    tag: {method: 'POST', params: {id: '@id', action: 'tag', force: 0, repo: '@repo', tag: '@tag'}, ignoreLoadingBar: true},
    inspect: {method: 'GET', params: {id: '@id', action: 'json'}},
    push: {
      method: 'POST', params: {action: 'push', id: '@tag'},
      isArray: true, transformResponse: jsonObjectsToArrayHandler,
      headers: { 'X-Registry-Auth': HttpRequestHelper.registryAuthenticationHeader },
      ignoreLoadingBar: true
    },
    create: {
      method: 'POST', params: {action: 'create', fromImage: '@fromImage', tag: '@tag'},
      isArray: true, transformResponse: jsonObjectsToArrayHandler,
      headers: { 'X-Registry-Auth': HttpRequestHelper.registryAuthenticationHeader },
      ignoreLoadingBar: true
    },
    download: {
      method: 'GET', params: {action:'get', names: '@names'},
      transformResponse: imageGetResponse,
      responseType: 'blob'
    },
    remove: {
      method: 'DELETE', params: {id: '@id', force: '@force'},
      isArray: true, transformResponse: deleteImageHandler
    }
  });
}]);
