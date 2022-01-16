import angular from 'angular';

import { browseGetResponse } from '../response/browse';

angular.module('portainer.agent').factory('BrowseVersion1', BrowseFactory);

function BrowseFactory($resource, API_ENDPOINT_ENDPOINTS) {
  return $resource(
    `${API_ENDPOINT_ENDPOINTS}/:endpointId/docker/browse/:volumeID/:action`,
    {},
    {
      ls: {
        method: 'GET',
        isArray: true,
        params: { action: 'ls' },
      },
      get: {
        method: 'GET',
        params: { action: 'get' },
        transformResponse: browseGetResponse,
        responseType: 'arraybuffer',
      },
      delete: {
        method: 'DELETE',
        params: { action: 'delete' },
      },
      rename: {
        method: 'PUT',
        params: { action: 'rename' },
      },
    }
  );
}
