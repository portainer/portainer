angular.module('portainer.agent').factory('VolumeBrowserService', [
  'StateManager', 'Browse', 'BrowseVersion1',
  function VolumeBrowserServiceFactory(StateManager, Browse, BrowseVersion1) {
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

    return service;
  }
]);
