angular.module('portainer.azure')
.factory('AzureService', ['$q', 'Azure', 'SubscriptionService', 'ResourceGroupService', 'ContainerGroupService', 'LocationService',
function AzureServiceFactory($q, Azure, SubscriptionService, ResourceGroupService, ContainerGroupService, LocationService) {
  'use strict';
  var service = {};

  service.deleteContainerGroup = function(id) {
    return Azure.delete(id, '2018-04-01');
  };

  service.resourceGroups = function() {
    return retrieveResourcesForAllSubscriptions(ResourceGroupService.resourceGroups);
  };

  service.containerGroups = function() {
    return retrieveResourcesForAllSubscriptions(ContainerGroupService.containerGroups);
  };

  service.locations = function() {
    return retrieveResourcesForAllSubscriptions(LocationService.locations);
  };

  function retrieveResourcesForAllSubscriptions(resourceQuery) {
    var deferred = $q.defer();

    var resources = [];
    SubscriptionService.subscriptions()
    .then(function success(data) {
      var subscriptions = data;

      var resourceQueries = [];
      for (var i = 0; i < subscriptions.length; i++) {
        var subscription = subscriptions[i];
        resourceQueries.push(resourceQuery(subscription.Id));
      }
      return $q.all(resourceQueries);
    })
    .then(function success(data) {
      for (var i = 0; i < data.length; i++) {
        var resourceQueryResult = data[i];
        resources = resources.concat(resourceQueryResult);
      }

      deferred.resolve(resources);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve resources', err: err });
    });

    return deferred.promise;
  }

  return service;
}]);
