import angular from 'angular';

angular.module('portainer.agent').factory('HostBrowserService', HostBrowserServiceFactory);

/* @ngInject */
function HostBrowserServiceFactory(Browse, Upload, API_ENDPOINT_ENDPOINTS, StateManager) {
  return { ls, get, delete: deletePath, rename, upload };

  function ls(endpointId, path) {
    return Browse.ls({ endpointId, path: path }).$promise;
  }

  function get(endpointId, path) {
    return Browse.get({ endpointId, path: path }).$promise;
  }

  function deletePath(endpointId, path) {
    return Browse.delete({ endpointId, path: path }).$promise;
  }

  function rename(endpointId, path, newPath) {
    const payload = {
      CurrentFilePath: path,
      NewFilePath: newPath,
    };
    return Browse.rename({ endpointId }, payload).$promise;
  }

  function upload(endpointId, Path, file, onProgress) {
    const agentVersion = StateManager.getAgentApiVersion();
    const url = `${API_ENDPOINT_ENDPOINTS}/${endpointId}/docker${agentVersion > 1 ? '/v' + agentVersion : ''}/browse/put`;

    return new Promise((resolve, reject) => {
      Upload.upload({
        url: url,
        data: { file, Path },
      }).then(resolve, reject, onProgress);
    });
  }
}
