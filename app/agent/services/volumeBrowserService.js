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

  function ls(endpointId, volumeId, path) {
    return getBrowseService().ls({ endpointId, volumeID: volumeId, path, version: getAgentApiVersion() }).$promise;
  }

  function get(endpointId, volumeId, path) {
    return getBrowseService().get({ endpointId, volumeID: volumeId, path, version: getAgentApiVersion() }).$promise;
  }

  function deletePath(endpointId, volumeId, path) {
    return getBrowseService().delete({ endpointId, volumeID: volumeId, path, version: getAgentApiVersion() }).$promise;
  }

  function rename(endpointId, volumeId, path, newPath) {
    const payload = {
      CurrentFilePath: path,
      NewFilePath: newPath,
    };
    return getBrowseService().rename({ endpointId, volumeID: volumeId, version: getAgentApiVersion() }, payload).$promise;
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
