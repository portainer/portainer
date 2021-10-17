angular.module('portainer.app').factory('Templates', [
  '$resource',
  '$browser',
  'API_ENDPOINT_TEMPLATES',
  function TemplatesFactory($resource, $browser, API_ENDPOINT_TEMPLATES) {
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_TEMPLATES}/:action`,
      {},
      {
        query: { method: 'GET' },
        file: { method: 'POST', params: { action: 'file' } },
      }
    );
  },
]);
