angular.module('portainer.app').factory('Webhooks', [
  '$resource',
  '$browser',
  'API_ENDPOINT_WEBHOOKS',
  function WebhooksFactory($resource, $browser, API_ENDPOINT_WEBHOOKS) {
    'use strict';
    return $resource(
      `${$browser.baseHref()}${API_ENDPOINT_WEBHOOKS}/:id`,
      {},
      {
        query: { method: 'GET', isArray: true },
        create: { method: 'POST' },
        remove: { method: 'DELETE', params: { id: '@id' } },
      }
    );
  },
]);
