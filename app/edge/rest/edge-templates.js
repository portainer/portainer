import angular from 'angular';

angular.module('portainer.edge').factory('EdgeTemplates', function EdgeStacksFactory($resource, API_ENDPOINT_EDGE_TEMPLATES) {
  return $resource(
    API_ENDPOINT_EDGE_TEMPLATES,
    {},
    {
      query: { method: 'GET', isArray: true },
    }
  );
});
