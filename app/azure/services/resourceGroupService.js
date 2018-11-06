import { ResourceGroupViewModel } from '../models/resource_group';

angular.module('portainer.azure')
.factory('ResourceGroupService', ['$q', 'ResourceGroup', function ResourceGroupServiceFactory($q, ResourceGroup) {
  'use strict';
  var service = {};

  service.resourceGroups = function(subscriptionId) {
    var deferred = $q.defer();

    ResourceGroup.query({ subscriptionId: subscriptionId }).$promise
    .then(function success(data) {
      var resourceGroups = data.value.map(function (item) {
        return new ResourceGroupViewModel(item, subscriptionId);
      });
      deferred.resolve(resourceGroups);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve resource groups', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
