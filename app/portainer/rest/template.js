const API_ENDPOINT_TEMPLATES = 'api/templates';

angular.module('portainer.app').factory('Templates', [
  '$resource',
  function TemplatesFactory($resource) {
    return $resource(
      API_ENDPOINT_TEMPLATES + '/:action',
      {},
      {
        query: { method: 'GET' },
        file: { method: 'POST', params: { action: 'file' } },
      }
    );
  },
]);
