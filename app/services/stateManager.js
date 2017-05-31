angular.module('portainer.services')
.factory('StateManager', ['$q', 'Info', 'InfoHelper', 'Version', 'LocalStorage', 'SettingsService', 'StatusService', function StateManagerFactory($q, Info, InfoHelper, Version, LocalStorage, SettingsService, StatusService) {
  'use strict';

  var manager = {};

  var state = {
    loading: true,
    application: {},
    endpoint: {},
    UI: {}
  };

  manager.getState = function() {
    return state;
  };

  manager.clean = function () {
    state.endpoint = {};
  };

  manager.updateLogo = function(logoURL) {
    state.application.logo = logoURL;
    LocalStorage.storeApplicationState(state.application);
  };

  manager.initialize = function () {
    var deferred = $q.defer();

    var endpointState = LocalStorage.getEndpointState();
    if (endpointState) {
      state.endpoint = endpointState;
    }

    var applicationState = LocalStorage.getApplicationState();
    if (applicationState) {
      state.application = applicationState;
      state.loading = false;
      deferred.resolve(state);
    } else {
      $q.all({
        settings: SettingsService.settings(),
        status: StatusService.status()
      })
      .then(function success(data) {
        var status = data.status;
        var settings = data.settings;
        state.application.authentication = status.Authentication;
        state.application.analytics = status.Analytics;
        state.application.endpointManagement = status.EndpointManagement;
        state.application.version = status.Version;
        state.application.logo = settings.LogoURL;
        LocalStorage.storeApplicationState(state.application);
        deferred.resolve(state);
      })
      .catch(function error(err) {
        deferred.reject({msg: 'Unable to retrieve server settings and status', err: err});
      })
      .finally(function final() {
        state.loading = false;
      });
    }

    return deferred.promise;
  };

  manager.updateEndpointState = function(loading) {
    var deferred = $q.defer();
    if (loading) {
      state.loading = true;
    }
    $q.all([Info.get({}).$promise, Version.get({}).$promise])
    .then(function success(data) {
      var endpointMode = InfoHelper.determineEndpointMode(data[0]);
      var endpointAPIVersion = parseFloat(data[1].ApiVersion);
      state.endpoint.mode = endpointMode;
      state.endpoint.apiVersion = endpointAPIVersion;
      LocalStorage.storeEndpointState(state.endpoint);
      state.loading = false;
      deferred.resolve();
    }, function error(err) {
      state.loading = false;
      deferred.reject({msg: 'Unable to connect to the Docker endpoint', err: err});
    });
    return deferred.promise;
  };

  return manager;
}]);
