angular.module('portainer.app').factory('Templates', [
  '$resource',
  'API_ENDPOINT_TEMPLATES',
  function TemplatesFactory($resource, API_ENDPOINT_TEMPLATES) {
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
