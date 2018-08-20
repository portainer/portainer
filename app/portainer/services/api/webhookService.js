angular.module('portainer.app')
.factory('WebhookService', ['$q', 'Webhook','Webhooks', 'EndpointProvider', function WebhookServiceFactory($q, Webhook, Webhooks, EndpointProvider) {
  'use strict';
  var service = {};
  var endpointID = 1;

  service.webhook = function(serviceID) {
    var deferred = $q.defer();
    console.log(EndpointProvider.endpointID)
    // var filters = { ServiceID: serviceID, EndpointID: EndpointProvider.endpointID };
    var filters = { ServiceID: serviceID, EndpointID: endpointID };
    var webhookData = {};
    Webhooks.query({filters:filters }).$promise
    .then(function success(data) {
      if(data.length == 0)
      {
        return deferred.resolve(null);
      }
      if(data.length > 1){
        deferred.reject({msg: "Error retrieving webhooks. Multiple exist for this service"})
      }
      webhookData.Token = data[0].Token;
      webhookData.Id = data[0].Id;
      deferred.resolve(webhookData);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve webhook'});
    });
    return deferred.promise;
  }


  service.createWebhook = function(serviceID) {
    return Webhooks.create({ServiceID: serviceID, EndpointID: endpointID}).$promise;
  };


  service.deleteWebhook = function(id) {
    return Webhook.remove({id: id}).$promise;
  };

  return service;
}]);
