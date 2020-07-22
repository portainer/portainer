import angular from 'angular';

angular.module('portainer.agent').factory('HostBrowserService', HostBrowserServiceFactory);

function HostBrowserServiceFactory(Browse, Upload, API_ENDPOINT_ENDPOINTS, EndpointProvider, StateManager) {
  return { ls, get, delete: deletePath, rename, upload };

  function ls(path) {
    return Browse.ls({ path: path }).$promise;
  }

  function get(path) {
    return Browse.get({ path: path }).$promise;
  }

  function deletePath(path) {
    return Browse.delete({ path: path }).$promise;
  }

  function rename(path, newPath) {
    const payload = {
      CurrentFilePath: path,
      NewFilePath: newPath,
    };
    return Browse.rename({}, payload).$promise;
  }

  function upload(path, file, onProgress) {
    const agentVersion = StateManager.getAgentApiVersion();
    const url = `${API_ENDPOINT_ENDPOINTS}/${EndpointProvider.endpointID()}/docker${agentVersion > 1 ? '/v' + agentVersion : ''}/browse/put`;

    return new Promise((resolve, reject) => {
      Upload.upload({
        url: url,
        data: { file: file, Path: path },
      }).then(resolve, reject, onProgress);
    });
  }
}
