import angular from 'angular';

angular.module('portainer.edge').factory('EdgeGroups', function EdgeGroupsFactory($resource, $browser, API_ENDPOINT_EDGE_GROUPS) {
  return $resource(
    `${$browser.baseHref()}${API_ENDPOINT_EDGE_GROUPS}/:id/:action`,
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
