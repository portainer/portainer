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

      backupInProgress: false,
      featureLimited: false,
      showHTTPS: !window.ddExtension,
    };

    $scope.BACKUP_FORM_TYPES = { S3: 's3', FILE: 'file' };

    $scope.formValues = {
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

    $scope.saveS3BackupSettings = function () {
      const payload = getS3SettingsPayload();
      BackupService.saveS3Settings(payload)
        .then(function success() {
          Notifications.success('Success', 'S3 Backup settings successfully saved');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to save S3 backup settings');
        })
        .finally(function final() {
          $scope.state.backupInProgress = false;
        });
    };

    $scope.exportBackup = function () {
      const payload = getS3SettingsPayload();
      BackupService.exportBackup(payload)
        .then(function success() {
          Notifications.success('Success', 'Exported backup to S3 successfully');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to export backup to S3');
        })
        .finally(function final() {
          $scope.state.backupInProgress = false;
        });
    };

    function getS3SettingsPayload() {
      return {
        Password: $scope.formValues.passwordProtectS3 ? $scope.formValues.passwordS3 : '',
        CronRule: $scope.formValues.scheduleAutomaticBackups ? $scope.formValues.cronRule : '',
        AccessKeyID: $scope.formValues.accessKeyId,
        SecretAccessKey: $scope.formValues.secretAccessKey,
        Region: $scope.formValues.region,
        BucketName: $scope.formValues.bucketName,
        S3CompatibleHost: $scope.formValues.s3CompatibleHost,
      };
    }

    function updateSettings(settings, successMessage = 'Settings updated') {
      // ignore CloudApiKeys to avoid overriding them
      //
      // it is not ideal solution as API still accepts CloudAPIKeys
      // which may override the cloud provider API keys
      settings.CloudApiKeys = undefined;
      return SettingsService.update(settings)
        .then(function success() {
          Notifications.success('Success', successMessage);
          StateManager.updateLogo(settings.LogoURL);
          StateManager.updateSnapshotInterval(settings.SnapshotInterval);
          StateManager.updateEnableTelemetry(settings.EnableTelemetry);
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
        .then(function success(settings) {
          $scope.settings = settings;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
        });
    }

    initView();
  },
]);
