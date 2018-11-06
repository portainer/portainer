angular.module('portainer.azure')
.factory('AzureService', ['$q', 'Azure', 'SubscriptionService', 'ResourceGroupService', 'ContainerGroupService', 'ProviderService',
function AzureServiceFactory($q, Azure, SubscriptionService, ResourceGroupService, ContainerGroupService, ProviderService) {
  'use strict';
  var service = {};

  service.deleteContainerGroup = function(id) {
    return Azure.delete(id, '2018-04-01');
  };

  service.createContainerGroup = function(model, subscriptionId, resourceGroupName) {
    return ContainerGroupService.create(model, subscriptionId, resourceGroupName);
  };

  service.subscriptions = function() {
    return SubscriptionService.subscriptions();
  };

  service.containerInstanceProvider = function(subscriptions) {
    return retrieveResourcesForEachSubscription(subscriptions, ProviderService.containerInstanceProvider);
  };

  service.resourceGroups = function(subscriptions) {
    return retrieveResourcesForEachSubscription(subscriptions, ResourceGroupService.resourceGroups);
  };

  service.containerGroups = function(subscriptions) {
    return retrieveResourcesForEachSubscription(subscriptions, ContainerGroupService.containerGroups);
  };

  service.aggregate = function(resourcesBySubcription) {
    var aggregatedResources = [];
    Object.keys(resourcesBySubcription).forEach(function(key) {
      aggregatedResources = aggregatedResources.concat(resourcesBySubcription[key]);
    });
    return aggregatedResources;
  };

  function retrieveResourcesForEachSubscription(subscriptions, resourceQuery) {
    var deferred = $q.defer();

    var resources = {};

    var resourceQueries = [];
    for (var i = 0; i < subscriptions.length; i++) {
      var subscription = subscriptions[i];
      resourceQueries.push(resourceQuery(subscription.Id));
    }

    $q.all(resourceQueries)
    .then(function success(data) {
      for (var i = 0; i < data.length; i++) {
        var result = data[i];
        resources[subscriptions[i].Id] = result;
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
