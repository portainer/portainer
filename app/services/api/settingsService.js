angular.module('portainer.services')
.factory('SettingsService', ['$q', 'Settings', function SettingsServiceFactory($q, Settings) {
  'use strict';
  var service = {};

  service.settings = function() {
    var deferred = $q.defer();

    Settings.get().$promise
    .then(function success(data) {
      var status = new SettingsViewModel(data);
      deferred.resolve(status);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve application settings', err: err });
    });

    return deferred.promise;
  };

  service.update = function(settings) {
    return Settings.update({}, settings).$promise;
  };

  return service;
}]);
