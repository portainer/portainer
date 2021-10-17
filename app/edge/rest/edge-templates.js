import angular from 'angular';

angular.module('portainer.edge').factory('EdgeTemplates', function EdgeStacksFactory($resource, $browser, API_ENDPOINT_EDGE_TEMPLATES) {
  return $resource(
    `${$browser.baseHref()}${API_ENDPOINT_EDGE_TEMPLATES}`,
    {},
    {
      query: { method: 'GET', isArray: true },
    }
  );
});
