import angular from 'angular';

import { API_ENDPOINT_WEBHOOKS } from '@/constants';

angular.module('portainer.app').factory('Webhooks', [
  '$resource',
  function WebhooksFactory($resource) {
    return $resource(
      `${API_ENDPOINT_WEBHOOKS}/:id`,
      {},
      {
        query: { method: 'GET', isArray: true },
        create: { method: 'POST' },
        remove: { method: 'DELETE', params: { id: '@id' } },
      }
    );
  },
]);
