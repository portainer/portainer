import angular from 'angular';

angular.module('portainer.edge').factory('EdgeGroups', function EdgeGroupsFactory($resource, API_ENDPOINT_EDGE_GROUPS) {
  return $resource(
    API_ENDPOINT_EDGE_GROUPS + '/:id/:action',
    {},
    {
      query: { method: 'GET', isArray: true },
    }
  );
});
