angular.module('portainer.services')
.factory('StateManager', ['$q', 'Config', 'Info', 'InfoHelper', 'Version', 'LocalStorage', function StateManagerFactory($q, Config, Info, InfoHelper, Version, LocalStorage) {
  'use strict';

  var state = {
    loading: true,
    application: {},
    endpoint: {}
  };

  return {
    initialize: function() {
      var endpointState = LocalStorage.getEndpointState();
      if (endpointState) {
        state.endpoint = endpointState;
      }

      var deferred = $q.defer();
      var applicationState = LocalStorage.getApplicationState();
      if (applicationState) {
        state.application = applicationState;
        state.loading = false;
        deferred.resolve(state);
      } else {
        Config.$promise.then(function success(data) {
          state.application.authentication = data.authentication;
          state.application.analytics = data.analytics;
          state.application.endpointManagement = data.endpointManagement;
          state.application.logo = data.logo;
          LocalStorage.storeApplicationState(state.application);
          state.loading = false;
          deferred.resolve(state);
        }, function error(err) {
          state.loading = false;
          deferred.reject({msg: 'Unable to retrieve server configuration', err: err});
        });
      }
      return deferred.promise;
    },
    clean: function() {
      state.endpoint = {};
    },
    updateEndpointState: function(loading) {
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
    },
    getState: function() {
      return state;
    }
  };
}]);
