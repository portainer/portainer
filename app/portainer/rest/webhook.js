angular.module('portainer.app')
.factory('Webhook', ['$resource', 'API_ENDPOINT_WEBHOOKS','EndpointProvider',
 function WebhooksFactory($resource, API_ENDPOINT_WEBHOOKS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_WEBHOOKS, {endpointId: EndpointProvider.endpointID}, {
    query: { method: 'GET' },
    create: { method: 'POST', params: { ServiceID: '@serviceID', EndpointId: '@endpointId'} }
  });
}]);
