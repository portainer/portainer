import angular from 'angular';

angular.module('portainer.app').controller('SettingsController', [
  '$scope',
  'Notifications',
  'SettingsService',
  function ($scope, Notifications, SettingsService) {
    $scope.updateSettings = updateSettings;
    $scope.handleSuccess = handleSuccess;
    $scope.requireNoteOnApplications = FeatureId.K8S_REQUIRE_NOTE_ON_APPLICATIONS;

    $scope.state = {
      actionInProgress: false,
      availableKubeconfigExpiryOptions: [
        {
          key: '1 day',
          value: '24h',
        },
        {
          key: '7 days',
          value: `${24 * 7}h`,
        },
        {
          key: '30 days',
          value: `${24 * 30}h`,
        },
        {
          key: '1 year',
          value: `${24 * 30 * 12}h`,
        },
        {
          key: 'No expiry',
          value: '0',
        },
      ],
      backupInProgress: false,
      featureLimited: false,
      showHTTPS: !window.ddExtension,
    };

    $scope.formValues = {
      KubeconfigExpiry: undefined,
      HelmRepositoryURL: undefined,
      BlackListedLabels: [],
      labelName: '',
      labelValue: '',
    };

    $scope.onToggleAddWithForm = function onToggleAddWithForm(checked) {
      $scope.$evalAsync(() => {
        $scope.formValues.GlobalDeploymentOptions.hideAddWithForm = checked;
        $scope.formValues.GlobalDeploymentOptions.hideWebEditor = false;
        $scope.formValues.GlobalDeploymentOptions.hideFileUpload = false;
        if (checked) {
          $scope.formValues.GlobalDeploymentOptions.hideWebEditor = true;
          $scope.formValues.GlobalDeploymentOptions.hideFileUpload = true;
        }
      });
    };

    $scope.onTogglePerEnvOverride = function onTogglePerEnvOverride(checked) {
      $scope.$evalAsync(() => {
        $scope.formValues.GlobalDeploymentOptions.perEnvOverride = checked;
      });
    };

    $scope.onToggleHideWebEditor = function onToggleHideWebEditor(checked) {
      $scope.$evalAsync(() => {
        $scope.formValues.GlobalDeploymentOptions.hideWebEditor = !checked;
      });
    };

    $scope.onToggleNoteOnApplications = function onToggleNoteOnApplications(checked) {
      $scope.$evalAsync(() => {
        $scope.formValues.GlobalDeploymentOptions.requireNoteOnApplications = checked;
      });
    };

    $scope.onToggleHideFileUpload = function onToggleHideFileUpload(checked) {
      $scope.$evalAsync(() => {
        $scope.formValues.GlobalDeploymentOptions.hideFileUpload = !checked;
      });
    };

    $scope.removeFilteredContainerLabel = function (index) {
      const filteredSettings = $scope.formValues.BlackListedLabels.filter((_, i) => i !== index);
      const filteredSettingsPayload = { BlackListedLabels: filteredSettings };
      updateSettings(filteredSettingsPayload, 'Hidden container settings updated');
    };

    $scope.addFilteredContainerLabel = function () {
      var label = {
        name: $scope.formValues.labelName,
        value: $scope.formValues.labelValue,
      };

      const filteredSettings = [...$scope.formValues.BlackListedLabels, label];
      const filteredSettingsPayload = { BlackListedLabels: filteredSettings };
      updateSettings(filteredSettingsPayload, 'Hidden container settings updated');
    };

    // only update the values from the kube settings widget. In future separate the api endpoints
    $scope.saveKubernetesSettings = function () {
      const kubeSettingsPayload = {
        KubeconfigExpiry: $scope.formValues.KubeconfigExpiry,
        HelmRepositoryURL: $scope.formValues.HelmRepositoryURL,
        GlobalDeploymentOptions: $scope.formValues.GlobalDeploymentOptions,
      };

      $scope.state.kubeSettingsActionInProgress = true;
      updateSettings(kubeSettingsPayload, 'Kubernetes settings updated');
    };

    function updateSettings(settings, successMessage = 'Settings updated') {
      return SettingsService.update(settings)
        .then(function success(settings) {
          Notifications.success('Success', successMessage);
          handleSuccess(settings);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to update settings');
        })
        .finally(function final() {
          $scope.state.kubeSettingsActionInProgress = false;
          $scope.state.actionInProgress = false;
        });
    }

    function initView() {
      SettingsService.settings()
        .then(function success(data) {
          var settings = data;
          $scope.settings = settings;

          $scope.formValues.KubeconfigExpiry = settings.KubeconfigExpiry;
          $scope.formValues.HelmRepositoryURL = settings.HelmRepositoryURL;
          $scope.formValues.BlackListedLabels = settings.BlackListedLabels;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
        });
    }

    initView();
  },
]);
