angular.module('portainer.app')
.factory('Webhook', ['$resource', 'API_ENDPOINT_WEBHOOK',
 function WebhookFactory($resource, API_ENDPOINT_WEBHOOK) {
  'use strict';
  return $resource(API_ENDPOINT_WEBHOOK + '/:id', {}, {
    remove: { method: 'DELETE', params: { id: '@id'} }
  });
}]);
