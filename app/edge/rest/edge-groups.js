import angular from 'angular';

import { API_ENDPOINT_EDGE_GROUPS } from '@/constants';

angular.module('portainer.edge').factory('EdgeGroups', function EdgeGroupsFactory($resource) {
  return $resource(
    API_ENDPOINT_EDGE_GROUPS + '/:id/:action',
    {},
    {
      create: { method: 'POST', ignoreLoadingBar: true },
      query: { method: 'GET', isArray: true },
      get: { method: 'GET', params: { id: '@id' } },
      update: { method: 'PUT', params: { id: '@Id' } },
      remove: { method: 'DELETE', params: { id: '@id' } },
    }
  );
});
