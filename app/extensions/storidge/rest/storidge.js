angular.module('extension.storidge')
.factory('Storidge', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function StoridgeFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/extensions/storidge/:resource/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    rebootCluster: { method: 'POST', params: { resource: 'cluster', action: 'reboot' } },
    shutdownCluster: { method: 'POST', params: { resource: 'cluster', action: 'shutdown' } },
    queryEvents: { method: 'GET', params: { resource: 'events' }, timeout: 4500, ignoreLoadingBar: true, isArray: true },
    getVersion: { method: 'GET', params: { resource: 'version' } },
    getInfo: { method: 'GET', params: { resource: 'info' }, timeout: 4500, ignoreLoadingBar: true },
    queryNodes: { method: 'GET', params: { resource: 'nodes' } },
    queryProfiles: { method: 'GET', params: { resource: 'profiles' } },
    getProfile: { method: 'GET', params: { resource: 'profiles' } },
    createProfile: { method: 'POST', params: { resource: 'profiles' } },
    updateProfile: { method: 'PUT', params: { resource: 'profiles', id: '@name' } },
    deleteProfile: { method: 'DELETE', params: { resource: 'profiles' } }
  });
}]);
