angular.module('portainer.rest')
.factory('Template', ['$resource', 'TEMPLATES_ENDPOINT', function TemplateFactory($resource, TEMPLATES_ENDPOINT) {
  return $resource(TEMPLATES_ENDPOINT, {}, {
    get: {method: 'GET', isArray: true}
  });
}]);
