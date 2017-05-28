angular.module('portainer.services')
.factory('SettingsService', ['$q', 'Settings', function SettingsServiceFactory($q, Settings) {
  'use strict';
  var service = {};

  service.status = function() {
    var deferred = $q.defer();

    Status.get()
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
