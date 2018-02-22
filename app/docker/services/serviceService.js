angular.module('portainer.docker')
.factory('ServiceService', ['$q', 'Service', 'ServiceHelper', 'TaskService', 'ResourceControlService', function ServiceServiceFactory($q, Service, ServiceHelper, TaskService, ResourceControlService) {
  'use strict';
  var service = {};

  service.services = function(filters) {
    var deferred = $q.defer();

    Service.query({ filters: filters ? filters : {} }).$promise
    .then(function success(data) {
      var services = data.map(function (item) {
        return new ServiceViewModel(item);
      });
      deferred.resolve(services);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve services', err: err });
    });

    return deferred.promise;
  };

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

  service.update = function(service, config) {
    return Service.update({ id: service.Id, version: service.Version }, config).$promise;
  };

  service.logs = function(id, stdout, stderr, timestamps, tail) {
    var parameters = {
      id: id,
      stdout: stdout || 0,
      stderr: stderr || 0,
      timestamps: timestamps || 0,
      tail: tail || 'all'
    };

    return Service.logs(parameters).$promise;
  };

  return service;
}]);
