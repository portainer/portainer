angular.module('portainer.azure')
.factory('ProviderService', ['$q', 'Provider', function ProviderServiceFactory($q, Provider) {
  'use strict';
  var service = {};

  service.containerInstanceProvider = function(subscriptionId) {
    var deferred = $q.defer();

    Provider.get({ subscriptionId: subscriptionId, providerNamespace: 'Microsoft.ContainerInstance' }).$promise
    .then(function success(data) {
      var locations = data.value.map(function (item) {
        return new ProviderViewModel(item);
      });
      deferred.resolve(locations);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve provider', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
