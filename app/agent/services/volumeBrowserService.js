angular.module('portainer.agent').factory('VolumeBrowserService', [
  'StateManager', 'Browse', 'BrowseVersion1', '$q', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', 'Upload',
  function VolumeBrowserServiceFactory(StateManager, Browse, BrowseVersion1, $q, API_ENDPOINT_ENDPOINTS, EndpointProvider, Upload) {
    'use strict';
    var service = {};

    function getAgentApiVersion() {
      var state = StateManager.getState();
      return state.endpoint.agentApiVersion;
    }

    function getBrowseService() {
      var agentVersion = getAgentApiVersion();
      return agentVersion > 1 ? Browse : BrowseVersion1;
    }

    service.ls = function(volumeId, path) {
      return getBrowseService().ls({ volumeID: volumeId, path: path, version: getAgentApiVersion() }).$promise;
    };

    service.get = function(volumeId, path) {
      return getBrowseService().get({ volumeID: volumeId, path: path, version: getAgentApiVersion() }).$promise;
    };

    service.delete = function(volumeId, path) {
      return getBrowseService().delete({ volumeID: volumeId, path: path, version: getAgentApiVersion() }).$promise;
    };

    service.rename = function(volumeId, path, newPath) {
      var payload = {
        CurrentFilePath: path, 
        NewFilePath: newPath
      };
      return getBrowseService().rename({ volumeID: volumeId, version: getAgentApiVersion() }, payload).$promise;
    };

    service.upload = function upload(path, file, volumeId, onProgress) {
      var deferred = $q.defer();
      var agentVersion = StateManager.getAgentApiVersion();
      if (agentVersion <2) {
        deferred.reject('upload is not supported on this agent version');
        return;
      }
      var url =
        API_ENDPOINT_ENDPOINTS +
        '/' +
        EndpointProvider.endpointID() +
        '/docker' +
        '/v' + agentVersion +
        '/browse/put?volumeID=' +
        volumeId;

      Upload.upload({
        url: url,
        data: { file: file, Path: path }
      }).then(deferred.resolve, deferred.reject, onProgress);
      return deferred.promise;
    };

    return service;
  }
]);
