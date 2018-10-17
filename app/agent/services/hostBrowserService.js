angular.module('portainer.agent').factory('HostBrowserService', [
  'Browse', 'Upload', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', '$q', 'StateManager',
  function HostBrowserServiceFactory(Browse, Upload, API_ENDPOINT_ENDPOINTS, EndpointProvider, $q, StateManager) {
    var service = {};

    service.ls = ls;
    service.get = get;
    service.delete = deletePath;
    service.rename = rename;
    service.upload = upload;

    function getAgentApiVersion() {
      var state = StateManager.getState();
      return state.endpoint.agentVersion;
    }

    function ls(path) {
      var agentVersion = getAgentApiVersion();
      return Browse.ls({ path: path, version: agentVersion }).$promise;
    }

    function get(path) {
      var agentVersion = getAgentApiVersion();
      return Browse.get({ path: path, version: agentVersion  }).$promise;
    }

    function deletePath(path) {
      var agentVersion = getAgentApiVersion();
      return Browse.delete({ path: path, version: agentVersion  }).$promise;
    }

    function rename(path, newPath) {
      var agentVersion = getAgentApiVersion();
      var payload = {
        CurrentFilePath: path,
        NewFilePath: newPath
      };
      return Browse.rename({ version: agentVersion }, payload).$promise;
    }

    function upload(path, file, onProgress) {
      var deferred = $q.defer();
      var agentVersion = getAgentApiVersion();
      var url =
        API_ENDPOINT_ENDPOINTS + '/' +
        EndpointProvider.endpointID() + '/docker' +
        (agentVersion > 1 ? '/v' + agentVersion : '') +
        '/browse/put';

      Upload.upload({
        url: url,
        data: { file: file, Path: path }
      }).then(deferred.resolve, deferred.reject, onProgress);
      return deferred.promise;
    }

    return service;
  }
]);
