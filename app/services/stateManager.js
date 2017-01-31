angular.module('portainer.services')
.factory('StateManager', ['$q', 'Info', 'InfoHelper', 'Version', 'LocalStorage', function StateManagerFactory($q, Info, InfoHelper, Version, LocalStorage) {
  'use strict';

  var state = {
    loading: true,
    application: {},
    endpoint: {}
  };

  return {
    init: function() {
      var endpointState = LocalStorage.getEndpointState();
      if (endpointState) {
        state.endpoint = endpointState;
      }
      state.loading = false;
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
