angular.module('portainer.app')
.factory('StateManager', ['$q', 'SystemService', 'InfoHelper', 'LocalStorage', 'SettingsService', 'StatusService', 'APPLICATION_CACHE_VALIDITY', 'AgentPingService',
function StateManagerFactory($q, SystemService, InfoHelper, LocalStorage, SettingsService, StatusService, APPLICATION_CACHE_VALIDITY, AgentPingService) {
  'use strict';

  var manager = {};

  var state = {
    loading: true,
    application: {},
    endpoint: {},
    UI: {
      dismissedInfoPanels: {},
      dismissedInfoHash: ''
    }
  };

  manager.dismissInformationPanel = function(id) {
    state.UI.dismissedInfoPanels[id] = true;
    LocalStorage.storeUIState(state.UI);
  };

  manager.dismissImportantInformation = function(hash) {
    state.UI.dismissedInfoHash = hash;
    LocalStorage.storeUIState(state.UI);
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

  manager.updateSnapshotInterval = function(interval) {
    state.application.snapshotInterval = interval;
    LocalStorage.storeApplicationState(state.application);
  };

 function assignStateFromStatusAndSettings(status, settings) {
   state.application.authentication = status.Authentication;
   state.application.analytics = status.Analytics;
   state.application.endpointManagement = status.EndpointManagement;
   state.application.snapshot = status.Snapshot;
   state.application.version = status.Version;
   state.application.logo = settings.LogoURL;
   state.application.snapshotInterval = settings.SnapshotInterval;
   state.application.validity = moment().unix();
 }

  function loadApplicationState() {
    var deferred = $q.defer();

    $q.all({
      settings: SettingsService.publicSettings(),
      status: StatusService.status()
    })
    .then(function success(data) {
      var status = data.status;
      var settings = data.settings;
      assignStateFromStatusAndSettings(status, settings);
      LocalStorage.storeApplicationState(state.application);
      deferred.resolve(state);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve server settings and status', err: err});
    })
    .finally(function final() {
      state.loading = false;
    });

    return deferred.promise;
  }

  manager.initialize = function () {
    var deferred = $q.defer();

    var UIState = LocalStorage.getUIState();
    if (UIState) {
      state.UI = UIState;
    }

    var endpointState = LocalStorage.getEndpointState();
    if (endpointState) {
      state.endpoint = endpointState;
    }

    var applicationState = LocalStorage.getApplicationState();
    if (applicationState) {
      var now = moment().unix();
      var cacheValidity = now - applicationState.validity;
      if (cacheValidity > APPLICATION_CACHE_VALIDITY) {
        loadApplicationState()
        .then(function success() {
          deferred.resolve(state);
        })
        .catch(function error(err) {
          deferred.reject(err);
        });
      } else {
        state.application = applicationState;
        state.loading = false;
        deferred.resolve(state);
      }
    } else {
      loadApplicationState()
      .then(function success() {
        deferred.resolve(state);
      })
      .catch(function error(err) {
        deferred.reject(err);
      });
    }

    return deferred.promise;
  };


  function assignExtensions(endpointExtensions) {
    var extensions = [];

    for (var i = 0; i < endpointExtensions.length; i++) {
      var extension = endpointExtensions[i];
      if (extension.Type === 1) {
        extensions.push('storidge');
      }
    }

    return extensions;
  }

  manager.updateEndpointState = function(name, type, extensions) {
    var deferred = $q.defer();

    if (type === 3) {
      state.endpoint.name = name;
      state.endpoint.mode = { provider: 'AZURE' };
      LocalStorage.storeEndpointState(state.endpoint);
      deferred.resolve();
      return deferred.promise;
    }

    $q.all({
      version: SystemService.version(),
      info: SystemService.info()
    })
    .then(function success(data) {
      var endpointMode = InfoHelper.determineEndpointMode(data.info, type);
      var endpointAPIVersion = parseFloat(data.version.ApiVersion);
      state.endpoint.mode = endpointMode;
      state.endpoint.name = name;
      state.endpoint.apiVersion = endpointAPIVersion;
      state.endpoint.extensions = assignExtensions(extensions);

      if (endpointMode.agentProxy) {
        return AgentPingService.ping().then(function onPingSuccess(data) {
          state.endpoint.agentApiVersion = data.version;
        });
      }
      
    }).then(function () {
      LocalStorage.storeEndpointState(state.endpoint);
      deferred.resolve();
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to connect to the Docker endpoint', err: err});
    })
    .finally(function final() {
      state.loading = false;
    });

    return deferred.promise;
  };

  return manager;
}]);
