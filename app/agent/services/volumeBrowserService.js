import angular from 'angular';

angular.module('portainer.agent').factory('VolumeBrowserService', VolumeBrowserServiceFactory);

/* @ngInject */
function VolumeBrowserServiceFactory(StateManager, Browse, BrowseVersion1, API_ENDPOINT_ENDPOINTS, Upload) {
  return {
    ls,
    get,
    delete: deletePath,
    rename,
    upload,
  };

  function getAgentApiVersion() {
    const state = StateManager.getState();
    return state.endpoint.agentApiVersion;
  }

  function getBrowseService() {
    const agentVersion = getAgentApiVersion();
    return agentVersion > 1 ? Browse : BrowseVersion1;
  }

  function ls(volumeId, path) {
    return getBrowseService().ls({ volumeID: volumeId, path, version: getAgentApiVersion() }).$promise;
  }

  function get(volumeId, path) {
    return getBrowseService().get({ volumeID: volumeId, path, version: getAgentApiVersion() }).$promise;
  }

  function deletePath(volumeId, path) {
    return getBrowseService().delete({ volumeID: volumeId, path, version: getAgentApiVersion() }).$promise;
  }

  function rename(volumeId, path, newPath) {
    const payload = {
      CurrentFilePath: path,
      NewFilePath: newPath,
    };
    return getBrowseService().rename({ volumeID: volumeId, version: getAgentApiVersion() }, payload).$promise;
  }

  function upload(endpointId, path, file, volumeId, onProgress) {
    const agentVersion = StateManager.getAgentApiVersion();
    if (agentVersion < 2) {
      throw new Error('upload is not supported on this agent version');
    }

    const url = `${API_ENDPOINT_ENDPOINTS}/${endpointId}/docker/v${agentVersion}/browse/put?volumeID=${volumeId}`;

    return new Promise((resolve, reject) => {
      Upload.upload({
        url: url,
        data: { file, Path: path },
      }).then(resolve, reject, onProgress);
    });
  }
}
