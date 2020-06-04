import angular from 'angular';

angular.module('portainer.app').factory('CustomTemplates', CustomTemplatesFactory);

function CustomTemplatesFactory($resource, API_ENDPOINT_CUSTOM_TEMPLATES) {
  return $resource(
    API_ENDPOINT_CUSTOM_TEMPLATES + '/:id/:action',
    {},
    {
      create: { method: 'POST', ignoreLoadingBar: true },
      query: { method: 'GET', isArray: true },
      get: { method: 'GET', params: { id: '@id' } },
      update: { method: 'PUT', params: { id: '@id' } },
      remove: { method: 'DELETE', params: { id: '@id' } },
      file: { method: 'GET', params: { id: '@id', action: 'file' } },
    }
  );
}
