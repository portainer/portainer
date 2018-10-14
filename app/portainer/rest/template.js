import angular from 'angular';

angular.module('portainer.app')
.factory('Templates', ['$resource', 'API_ENDPOINT_TEMPLATES', function TemplatesFactory($resource, API_ENDPOINT_TEMPLATES) {
  return $resource(API_ENDPOINT_TEMPLATES + '/:id', {}, {
    create: { method: 'POST' },
    query: { method: 'GET', isArray: true },
    get: { method: 'GET', params: { id: '@id'} },
    update: { method: 'PUT', params: { id: '@id'} },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
