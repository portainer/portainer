import _ from 'lodash-es';
import moment from 'moment';

angular.module('portainer.app').factory('StateManager', [
  '$q',
  'SystemService',
  'InfoHelper',
  'EndpointProvider',
  'LocalStorage',
  'SettingsService',
  'StatusService',
  'APPLICATION_CACHE_VALIDITY',
  'AgentPingService',
  '$analytics',
  function StateManagerFactory(
    $q,
    SystemService,
    InfoHelper,
    EndpointProvider,
    LocalStorage,
    SettingsService,
    StatusService,
    APPLICATION_CACHE_VALIDITY,
    AgentPingService,
    $analytics
  ) {
    'use strict';

    var manager = {};

    var state = {
      loading: true,
      application: {},
      endpoint: {},
      UI: {
        dismissedInfoPanels: {},
        dismissedInfoHash: '',
      },
      extensions: [],
    };

    manager.setVersionInfo = function (versionInfo) {
      state.application.versionStatus = versionInfo;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.dismissInformationPanel = function (id) {
      state.UI.dismissedInfoPanels[id] = true;
      LocalStorage.storeUIState(state.UI);
    };

    manager.dismissImportantInformation = function (hash) {
      state.UI.dismissedInfoHash = hash;
      LocalStorage.storeUIState(state.UI);
    };

    manager.getState = function () {
      return state;
    };

    manager.clean = function () {
      state.endpoint = {};
      state.extensions = [];
    };

    manager.updateLogo = function (logoURL) {
      state.application.logo = logoURL;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.updateSnapshotInterval = function (interval) {
      state.application.snapshotInterval = interval;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.updateEnableHostManagementFeatures = function (enableHostManagementFeatures) {
      state.application.enableHostManagementFeatures = enableHostManagementFeatures;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.updateEnableVolumeBrowserForNonAdminUsers = function (enableVolumeBrowserForNonAdminUsers) {
      state.application.enableVolumeBrowserForNonAdminUsers = enableVolumeBrowserForNonAdminUsers;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.updateEnableEdgeComputeFeatures = function updateEnableEdgeComputeFeatures(enableEdgeComputeFeatures) {
      state.application.enableEdgeComputeFeatures = enableEdgeComputeFeatures;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.updateAllowHostNamespaceForRegularUsers = function (allowHostNamespaceForRegularUsers) {
      state.application.allowHostNamespaceForRegularUsers = allowHostNamespaceForRegularUsers;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.updateAllowDeviceMappingForRegularUsers = function updateAllowDeviceMappingForRegularUsers(allowDeviceMappingForRegularUsers) {
      state.application.allowDeviceMappingForRegularUsers = allowDeviceMappingForRegularUsers;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.updateAllowStackManagementForRegularUsers = function updateAllowStackManagementForRegularUsers(allowStackManagementForRegularUsers) {
      state.application.allowStackManagementForRegularUsers = allowStackManagementForRegularUsers;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.updateAllowContainerCapabilitiesForRegularUsers = function updateAllowContainerCapabilitiesForRegularUsers(allowContainerCapabilitiesForRegularUsers) {
      state.application.allowContainerCapabilitiesForRegularUsers = allowContainerCapabilitiesForRegularUsers;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.updateAllowBindMountsForRegularUsers = function updateAllowBindMountsForRegularUsers(allowBindMountsForRegularUsers) {
      state.application.allowBindMountsForRegularUsers = allowBindMountsForRegularUsers;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.updateAllowPrivilegedModeForRegularUsers = function (AllowPrivilegedModeForRegularUsers) {
      state.application.allowPrivilegedModeForRegularUsers = AllowPrivilegedModeForRegularUsers;
      LocalStorage.storeApplicationState(state.application);
    };

    manager.updateEnableTelemetry = function updateEnableTelemetry(enableTelemetry) {
      state.application.enableTelemetry = enableTelemetry;
      $analytics.setOptOut(!enableTelemetry);
      LocalStorage.storeApplicationState(state.application);
    };

    function assignStateFromStatusAndSettings(status, settings) {
      state.application.version = status.Version;
      state.application.enableTelemetry = settings.EnableTelemetry;
      state.application.logo = settings.LogoURL;
      state.application.snapshotInterval = settings.SnapshotInterval;
      state.application.enableHostManagementFeatures = settings.EnableHostManagementFeatures;
      state.application.enableVolumeBrowserForNonAdminUsers = settings.AllowVolumeBrowserForRegularUsers;
      state.application.enableEdgeComputeFeatures = settings.EnableEdgeComputeFeatures;
      state.application.allowDeviceMappingForRegularUsers = settings.AllowDeviceMappingForRegularUsers;
      state.application.allowStackManagementForRegularUsers = settings.AllowStackManagementForRegularUsers;
      state.application.allowContainerCapabilitiesForRegularUsers = settings.AllowContainerCapabilitiesForRegularUsers;
      state.application.allowBindMountsForRegularUsers = settings.AllowBindMountsForRegularUsers;
      state.application.allowPrivilegedModeForRegularUsers = settings.AllowPrivilegedModeForRegularUsers;
      state.application.allowHostNamespaceForRegularUsers = settings.AllowHostNamespaceForRegularUsers;
      state.application.validity = moment().unix();
    }

    function loadApplicationState() {
      var deferred = $q.defer();

      $q.all({
        settings: SettingsService.publicSettings(),
        status: StatusService.status(),
      })
        .then(function success(data) {
          var status = data.status;
          var settings = data.settings;
          assignStateFromStatusAndSettings(status, settings);
          $analytics.setOptOut(!settings.EnableTelemetry);
          LocalStorage.storeApplicationState(state.application);
          deferred.resolve(state);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve server settings and status', err: err });
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

      const extensionState = LocalStorage.getExtensionState();
      if (extensionState) {
        state.extensions = extensionState;
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
            .then(() => deferred.resolve(state))
            .catch((err) => deferred.reject(err));
        } else {
          state.application = applicationState;
          state.loading = false;
          $analytics.setOptOut(!state.application.enableTelemetry);
          deferred.resolve(state);
        }
      } else {
        loadApplicationState()
          .then(() => deferred.resolve(state))
          .catch((err) => deferred.reject(err));
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

    manager.updateEndpointState = function (endpoint, extensions) {
      var deferred = $q.defer();

      if (endpoint.Type === 3) {
        state.endpoint.name = endpoint.Name;
        state.endpoint.mode = { provider: 'AZURE' };
        LocalStorage.storeEndpointState(state.endpoint);
        deferred.resolve();
        return deferred.promise;
      } else if (endpoint.Type === 5 || endpoint.Type === 6 || endpoint.Type === 7) {
        state.endpoint.name = endpoint.Name;
        state.endpoint.mode = { provider: 'KUBERNETES' };
        LocalStorage.storeEndpointState(state.endpoint);
        deferred.resolve();
        return deferred.promise;
      }

      const reload = endpoint.Status === 1 || !endpoint.Snaphosts || !endpoint.Snaphosts.length || !endpoint.Snapshots[0].SnapshotRaw;

      $q.all({
        version: reload ? SystemService.version() : $q.when(endpoint.Snapshots[0].SnapshotRaw.Version),
        info: reload ? SystemService.info() : $q.when(endpoint.Snapshots[0].SnapshotRaw.Info),
      })
        .then(function success(data) {
          var endpointMode = InfoHelper.determineEndpointMode(data.info, endpoint.Type);
          var endpointAPIVersion = parseFloat(data.version.ApiVersion);
          state.endpoint.mode = endpointMode;
          state.endpoint.name = endpoint.Name;
          state.endpoint.type = endpoint.Type;
          state.endpoint.apiVersion = endpointAPIVersion;
          state.endpoint.extensions = assignExtensions(extensions);

          if (endpointMode.agentProxy && endpoint.Status === 1) {
            return AgentPingService.ping().then(function onPingSuccess(data) {
              state.endpoint.agentApiVersion = data.version;
            });
          }
        })
        .then(function () {
          LocalStorage.storeEndpointState(state.endpoint);
          deferred.resolve();
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to connect to the Docker endpoint', err: err });
        })
        .finally(function final() {
          state.loading = false;
        });

      return deferred.promise;
    };

    manager.getAgentApiVersion = function getAgentApiVersion() {
      return state.endpoint.agentApiVersion;
    };

    manager.saveExtensions = function (extensions) {
      state.extensions = extensions;
      LocalStorage.storeExtensionState(state.extensions);
    };

    manager.getExtensions = function () {
      return state.extensions;
    };

    manager.getExtension = function (extensionId) {
      return _.find(state.extensions, { Id: extensionId, Enabled: true });
    };

    return manager;
  },
]);
