angular.module('portainer.rest')
.factory('Templates', ['$resource', 'TEMPLATES_ENDPOINT', function TemplatesFactory($resource, TEMPLATES_ENDPOINT) {
  return $resource(TEMPLATES_ENDPOINT, {}, {
    get: {method: 'GET', isArray: true}
  });
}]);
