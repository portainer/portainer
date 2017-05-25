angular.module('portainer.services')
.factory('ServiceService', ['$q', 'Service', 'ResourceControlService', function ServiceServiceFactory($q, Service, ResourceControlService) {
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

  service.remove = function(service) {
    var deferred = $q.defer();

    Service.remove({id: service.Id}).$promise
    .then(function success() {
      if (service.ResourceControl && service.ResourceControl.Type === 2) {
        return ResourceControlService.deleteResourceControl(service.ResourceControl.Id);
      }
    })
    .then(function success() {
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to remove service', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
