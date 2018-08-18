angular.module('portainer.app')
.factory('Webhook', ['$resource', 'API_ENDPOINT_WEBHOOK','EndpointProvider',
 function WebhookFactory($resource, API_ENDPOINT_WEBHOOK, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_WEBHOOK + '/:serviceID', {}, {
    get: { method: 'GET', params: {serviceID: '@serviceID'} } ,
    delete: { method: 'DELETE' }
  });
}]);
