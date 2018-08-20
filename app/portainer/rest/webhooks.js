angular.module('portainer.app')
.factory('Webhooks', ['$resource', 'API_ENDPOINT_WEBHOOKS',
 function WebhooksFactory($resource, API_ENDPOINT_WEBHOOKS) {
  'use strict';
  return $resource(API_ENDPOINT_WEBHOOKS, {}, {
    query: { method: 'GET', isArray: true },
    create: { method: 'POST' },
  });
}]);
