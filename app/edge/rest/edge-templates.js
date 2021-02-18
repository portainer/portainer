import angular from 'angular';

const API_ENDPOINT_EDGE_TEMPLATES = 'api/edge_templates';

angular.module('portainer.edge').factory('EdgeTemplates', function EdgeStacksFactory($resource) {
  return $resource(
    API_ENDPOINT_EDGE_TEMPLATES,
    {},
    {
      query: { method: 'GET', isArray: true },
    }
  );
});
