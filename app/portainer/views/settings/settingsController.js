angular.module('portainer.app')
.controller('SettingsController', ['$scope', '$state', 'Notifications', 'ModalService', 'SettingsService', 'StateManager',
function ($scope, $state, Notifications, ModalService, SettingsService, StateManager) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.formValues = {
    customLogo: false,
    resourcesArePublicByDefault: false,
    externalTemplates: false,
    restrictBindMounts: false,
    restrictPrivilegedMode: false,
    labelName: '',
    labelValue: '',
    enableHostManagementFeatures: false
  };

  $scope.removeFilteredContainerLabel = function(index) {
    var settings = $scope.settings;
    settings.BlackListedLabels.splice(index, 1);

    updateSettings(settings);
  };

  $scope.addFilteredContainerLabel = function() {
    var settings = $scope.settings;
    var label = {
      name: $scope.formValues.labelName,
      value: $scope.formValues.labelValue
    };
    settings.BlackListedLabels.push(label);

    updateSettings(settings);
  };

  $scope.confirmPublicByDefaultUpdate = function () {
    if ($scope.formValues.resourcesArePublicByDefault) {
      ModalService.confirmPublicByDefaultUpdateEnable(function (confirmed) {
        if(confirmed) {
          var settings = $scope.settings;
          settings.ResourcesArePublicByDefault = $scope.formValues.resourcesArePublicByDefault;
        } else {
          initView();
        }
      });
    } else {
      ModalService.confirmPublicByDefaultUpdateDisable(function (confirmed) {
        if(confirmed) {
          var settings = $scope.settings;
          settings.ResourcesArePublicByDefault = $scope.formValues.resourcesArePublicByDefault;
        } else {
          initView();
        }
      });
    }
  };

  $scope.saveApplicationSettings = function() {
    var settings = $scope.settings;

    if (!$scope.formValues.customLogo) {
      settings.LogoURL = '';
    }

    if (!$scope.formValues.externalTemplates) {
      settings.TemplatesURL = '';
    }

    settings.ResourcesArePublicByDefault = $scope.formValues.resourcesArePublicByDefault;
    settings.AllowBindMountsForRegularUsers = !$scope.formValues.restrictBindMounts;
    settings.AllowPrivilegedModeForRegularUsers = !$scope.formValues.restrictPrivilegedMode;
    settings.EnableHostManagementFeatures = $scope.formValues.enableHostManagementFeatures;

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
      if (settings.TemplatesURL !== '') {
        $scope.formValues.externalTemplates = true;
      }
      $scope.formValues.resourcesArePublicByDefault = settings.ResourcesArePublicByDefault;
      $scope.formValues.restrictBindMounts = !settings.AllowBindMountsForRegularUsers;
      $scope.formValues.restrictPrivilegedMode = !settings.AllowPrivilegedModeForRegularUsers;
      $scope.formValues.enableHostManagementFeatures = settings.EnableHostManagementFeatures;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve application settings');
    });
  }

  initView();
}]);
