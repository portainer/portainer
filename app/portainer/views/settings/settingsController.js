import angular from 'angular';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { options } from '@/react/portainer/settings/SettingsView/backup-options';

angular.module('portainer.app').controller('SettingsController', [
  '$scope',
  'Notifications',
  'SettingsService',
  'StateManager',
  'BackupService',
  'FileSaver',
  function ($scope, Notifications, SettingsService, StateManager, BackupService, FileSaver) {
    $scope.customBannerFeatureId = FeatureId.CUSTOM_LOGIN_BANNER;
    $scope.s3BackupFeatureId = FeatureId.S3_BACKUP_SETTING;
    $scope.enforceDeploymentOptions = FeatureId.ENFORCE_DEPLOYMENT_OPTIONS;

    $scope.updateSettings = updateSettings;

    $scope.backupOptions = options;

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

    $scope.BACKUP_FORM_TYPES = { S3: 's3', FILE: 'file' };

    $scope.formValues = {
      KubeconfigExpiry: undefined,
      HelmRepositoryURL: undefined,
      BlackListedLabels: [],
      labelName: '',
      labelValue: '',
      passwordProtect: false,
      password: '',
      backupFormType: $scope.BACKUP_FORM_TYPES.FILE,
    };

    $scope.onToggleAutoBackups = function onToggleAutoBackups(checked) {
      $scope.$evalAsync(() => {
        $scope.formValues.scheduleAutomaticBackups = checked;
      });
    };

    $scope.onBackupOptionsChange = function (type, limited) {
      $scope.formValues.backupFormType = type;
      $scope.state.featureLimited = limited;
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

    $scope.downloadBackup = function () {
      const payload = {};
      if ($scope.formValues.passwordProtect) {
        payload.password = $scope.formValues.password;
      }

      $scope.state.backupInProgress = true;

      BackupService.downloadBackup(payload)
        .then(function success(data) {
          const downloadData = new Blob([data.file], { type: 'application/gzip' });
          FileSaver.saveAs(downloadData, data.name);
          Notifications.success('Success', 'Backup successfully downloaded');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to download backup');
        })
        .finally(function final() {
          $scope.state.backupInProgress = false;
        });
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
      // ignore CloudApiKeys to avoid overriding them
      //
      // it is not ideal solution as API still accepts CloudAPIKeys
      // which may override the cloud provider API keys
      settings.CloudApiKeys = undefined;
      return SettingsService.update(settings)
        .then(function success(response) {
          Notifications.success('Success', successMessage);
          StateManager.updateLogo(settings.LogoURL);
          StateManager.updateSnapshotInterval(settings.SnapshotInterval);
          StateManager.updateEnableTelemetry(settings.EnableTelemetry);
          $scope.formValues.BlackListedLabels = response.BlackListedLabels;
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
