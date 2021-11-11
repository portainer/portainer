import { SettingsViewModel } from '../../models/settings';

import { publicSettings } from './settings.service';

angular.module('portainer.app').factory('SettingsService', SettingsServiceFactory);

function SettingsServiceFactory($q, Settings) {
  return {
    settings,
    update,
    publicSettings,
  };

  function settings() {
    var deferred = $q.defer();

    Settings.get()
      .$promise.then(function success(data) {
        var settings = new SettingsViewModel(data);
        deferred.resolve(settings);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve application settings', err: err });
      });

    return deferred.promise;
  }

  function update(settings) {
    return Settings.update({}, settings).$promise;
  }
}
