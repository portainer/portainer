angular.module('extension.storidge')
.factory('Storidge', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function StoridgeFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/extensions/storidge/:resource/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    rebootCluster: { method: 'POST', params: { resource: 'clusters', action: 'reboot' } },
    shutdownCluster: { method: 'POST', params: { resource: 'clusters', action: 'shutdown' } },
    queryEvents: { method: 'GET', params: { resource: 'clusters', action: 'events' }, timeout: 4500, ignoreLoadingBar: true, isArray: true },
    getVersion: { method: 'GET', params: { resource: 'clusters', action: 'version' } },
    getInfo: { method: 'GET', params: { resource: 'clusters', action: 'info' }, timeout: 4500, ignoreLoadingBar: true },
    queryNodes: { method: 'GET', params: { resource: 'nodes' } },
    queryProfiles: { method: 'GET', params: { resource: 'profiles' } },
    getProfile: { method: 'GET', params: { resource: 'profiles' } },
    createProfile: { method: 'POST', params: { resource: 'profiles' } },
    updateProfile: { method: 'PUT', params: { resource: 'profiles', id: '@name' } },
    deleteProfile: { method: 'DELETE', params: { resource: 'profiles' } },
    queryDrives: { method: 'GET', params: { resource: 'drives' } },
    getDrive: { method: 'GET', params: { resource: 'drives', id: '@id' } },
    addDrive: { method: 'POST', params: { resource: 'drives' } },
    removeDrive: { method: 'DELETE', params: { resource: 'drives', id: '@id' } },
    getNode: { method: 'GET', params: { resource: 'nodes', id: '@id' } }
  });
}]);
