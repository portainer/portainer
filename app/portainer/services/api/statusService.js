angular.module('portainer.app')
.factory('StatusService', ['$q', 'Status', function StatusServiceFactory($q, Status) {
  'use strict';
  var service = {};

  service.status = function() {
    var deferred = $q.defer();

    Status.get().$promise
    .then(function success(data) {
      var status = new StatusViewModel(data);
      deferred.resolve(status);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve application status', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
