angular.module('portainer.azure')
.factory('AzureDashboardService', ['$q', 'SubscriptionService', 'ResourceGroupService',
function AzureDashboardServiceFactory($q, SubscriptionService, ResourceGroupService) {
  'use strict';
  var service = {};

  service.resourceGroups = function() {
    var deferred = $q.defer();


    var resourceGroups = [];

    SubscriptionService.subscriptions()
    .then(function success(data) {
      var subscriptions = data;

      var resourceGroupQueries = [];
      for (var i = 0; i < subscriptions.length; i++) {
        var subscription = subscriptions[i];
        resourceGroupQueries.push(ResourceGroupService.resourceGroups(subscription.Id));
      }
      return $q.all(resourceGroupQueries);
    })
    .then(function success(data) {
      for (var i = 0; i < data.length; i++) {
        var resourceGroup = data[i];
        resourceGroups.push(resourceGroup);
      }

      deferred.resolve(resourceGroups);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve resource groups', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
