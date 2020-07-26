angular.module('portainer.app').controller('SettingsController', [
  '$scope',
  '$state',
  'Notifications',
  'SettingsService',
  'StateManager',
  function ($scope, $state, Notifications, SettingsService, StateManager) {
    $scope.state = {
      actionInProgress: false,
      availableEdgeAgentCheckinOptions: [
        {
          key: '5 seconds',
          value: 5,
        },
        {
          key: '10 seconds',
          value: 10,
        },
        {
          key: '30 seconds',
          value: 30,
        },
      ],
    };

    $scope.formValues = {
      customLogo: false,
      restrictBindMounts: false,
      restrictPrivilegedMode: false,
      labelName: '',
      labelValue: '',
      enableHostManagementFeatures: false,
      enableVolumeBrowser: false,
      enableEdgeComputeFeatures: false,
      restrictHostNamespaceForRegularUsers: false,
      allowDeviceMappingForRegularUsers: false,
    };

    $scope.removeFilteredContainerLabel = function (index) {
      var settings = $scope.settings;
      settings.BlackListedLabels.splice(index, 1);

      updateSettings(settings);
    };

    $scope.addFilteredContainerLabel = function () {
      var settings = $scope.settings;
      var label = {
        name: $scope.formValues.labelName,
        value: $scope.formValues.labelValue,
      };
      settings.BlackListedLabels.push(label);

      updateSettings(settings);
    };

    $scope.saveApplicationSettings = function () {
      var settings = $scope.settings;

      if (!$scope.formValues.customLogo) {
        settings.LogoURL = '';
      }

      settings.AllowBindMountsForRegularUsers = !$scope.formValues.restrictBindMounts;
      settings.AllowPrivilegedModeForRegularUsers = !$scope.formValues.restrictPrivilegedMode;
      settings.AllowVolumeBrowserForRegularUsers = $scope.formValues.enableVolumeBrowser;
      settings.EnableHostManagementFeatures = $scope.formValues.enableHostManagementFeatures;
      settings.EnableEdgeComputeFeatures = $scope.formValues.enableEdgeComputeFeatures;
      settings.AllowHostNamespaceForRegularUsers = !$scope.formValues.restrictHostNamespaceForRegularUsers;
      settings.AllowDeviceMappingForRegularUsers = !$scope.formValues.disableDeviceMappingForRegularUsers;

      $scope.state.actionInProgress = true;
      updateSettings(settings);
    };

    function updateSettings(settings) {
      SettingsService.update(settings)
        .then(function success() {
          Notifications.success('Settings updated');
          StateManager.updateLogo(settings.LogoURL);
          StateManager.updateSnapshotInterval(settings.SnapshotInterval);
          StateManager.updateEnableHostManagementFeatures(settings.EnableHostManagementFeatures);
          StateManager.updateEnableVolumeBrowserForNonAdminUsers(settings.AllowVolumeBrowserForRegularUsers);
          StateManager.updateAllowHostNamespaceForRegularUsers(settings.AllowHostNamespaceForRegularUsers);
          StateManager.updateEnableEdgeComputeFeatures(settings.EnableEdgeComputeFeatures);
          StateManager.updateAllowDeviceMappingForRegularUsers(settings.AllowDeviceMappingForRegularUsers);
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to update settings');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    }

    function initView() {
      SettingsService.settings()
        .then(function success(data) {
          var settings = data;
          $scope.settings = settings;

          if (settings.LogoURL !== '') {
            $scope.formValues.customLogo = true;
          }
          $scope.formValues.restrictBindMounts = !settings.AllowBindMountsForRegularUsers;
          $scope.formValues.restrictPrivilegedMode = !settings.AllowPrivilegedModeForRegularUsers;
          $scope.formValues.enableVolumeBrowser = settings.AllowVolumeBrowserForRegularUsers;
          $scope.formValues.enableHostManagementFeatures = settings.EnableHostManagementFeatures;
          $scope.formValues.enableEdgeComputeFeatures = settings.EnableEdgeComputeFeatures;
          $scope.formValues.restrictHostNamespaceForRegularUsers = !settings.AllowHostNamespaceForRegularUsers;
          $scope.formValues.disableDeviceMappingForRegularUsers = !settings.AllowDeviceMappingForRegularUsers;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
        });
    }

    initView();
  },
]);
