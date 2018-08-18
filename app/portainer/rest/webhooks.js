angular.module('portainer.app')
.factory('Webhooks', ['$resource', 'API_ENDPOINT_WEBHOOKS','EndpointProvider',
 function WebhooksFactory($resource, API_ENDPOINT_WEBHOOKS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_WEBHOOKS, {}, {
    query: { method: 'GET', isArray: true },
    create: { method: 'POST' },
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
