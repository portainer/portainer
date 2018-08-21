angular.module('portainer.app')
.factory('WebhookService', ['$q', 'Webhooks', 'EndpointProvider', function WebhookServiceFactory($q, Webhooks, EndpointProvider) {
  'use strict';
  var service = {};
  var temp_endpointID = 1; //Hard coded while I figure out why the EndpointProvider isn't doing what I expect

  service.webhook = function(serviceID, endpointID) {
    var deferred = $q.defer();
    console.log(endpointID);
    endpointID = temp_endpointID;
    var filters = { ServiceID: serviceID, EndpointID: endpointID };
    var webhookData = {};
    Webhooks.query({filters:filters }).$promise
    .then(function success(data) {
      if(data.length == 0) //No webhook exists, we capture the 404 here
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


  service.createWebhook = function(serviceID, endpointID) {
    console.log(endpointID); //Returns undefined
    endpointID = temp_endpointID;
    return Webhooks.create({ServiceID: serviceID, EndpointID: endpointID}).$promise;
  };


  service.deleteWebhook = function(id) {
    return Webhooks.remove({id: id}).$promise;
  };

  return service;
}]);
