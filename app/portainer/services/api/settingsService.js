angular.module('portainer.app').factory('SettingsService', SettingsServiceFactory);
function SettingsServiceFactory(Settings) {
  var service = {};

  service.update = function (settings) {
    return Settings.update({}, settings).$promise;
  };

  return service;
}
