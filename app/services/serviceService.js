angular.module('portainer.services')
.factory('ServiceService', ['$q', 'Service', function ServiceServiceFactory($q, Service) {
  'use strict';
  var service = {};

  service.service = function(id) {
    var deferred = $q.defer();

    Service.get({ id: id }).$promise
    .then(function success(data) {
      var service = new ServiceViewModel(data);
      deferred.resolve(service);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve service details', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
