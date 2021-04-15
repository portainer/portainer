angular.module('portainer.app').controller('SettingsController', [
  '$scope',
  '$state',
  'Notifications',
  'SettingsService',
  'StateManager',
  'BackupService',
  'FileSaver',
  function ($scope, $state, Notifications, SettingsService, StateManager, BackupService, FileSaver) {
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

      backupInProgress: false,
    };

    $scope.BACKUP_FORM_TYPES = { S3: 's3', FILE: 'file' };

    $scope.formValues = {
      customLogo: false,
      labelName: '',
      labelValue: '',
      enableEdgeComputeFeatures: false,
      enableTelemetry: false,
      passwordProtect: false,
      password: '',
      scheduleAutomaticBackups: true,
      cronRule: '',
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
      bucketName: '',
      backupFormType: $scope.BACKUP_FORM_TYPES.FILE,
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
          Notifications.success('Backup successfully downloaded');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to download backup');
        })
        .finally(function final() {
          $scope.state.backupInProgress = false;
        });
    };

    $scope.saveApplicationSettings = function () {
      var settings = $scope.settings;

      if (!$scope.formValues.customLogo) {
        settings.LogoURL = '';
      }

      settings.EnableEdgeComputeFeatures = $scope.formValues.enableEdgeComputeFeatures;
      settings.EnableTelemetry = $scope.formValues.enableTelemetry;

      $scope.state.actionInProgress = true;
      updateSettings(settings);
    };

    $scope.saveS3BackupSettings = function () {
      const payload = getS3SettingsPayload();
      BackupService.saveS3Settings(payload)
        .then(function success() {
          Notifications.success('S3 Backup settings successfully saved');
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
          Notifications.success('Exported backup to S3 successfully');
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
      };
    }

    function updateSettings(settings) {
      SettingsService.update(settings)
        .then(function success() {
          Notifications.success('Settings updated');
          StateManager.updateLogo(settings.LogoURL);
          StateManager.updateSnapshotInterval(settings.SnapshotInterval);
          StateManager.updateEnableEdgeComputeFeatures(settings.EnableEdgeComputeFeatures);
          StateManager.updateEnableTelemetry(settings.EnableTelemetry);
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
      BackupService.getS3Settings()
        .then(function success(data) {
          $scope.formValues.passwordS3 = data.Password;
          $scope.formValues.cronRule = data.CronRule;
          $scope.formValues.accessKeyId = data.AccessKeyID;
          $scope.formValues.secretAccessKey = data.SecretAccessKey;
          $scope.formValues.region = data.Region;
          $scope.formValues.bucketName = data.BucketName;

          $scope.formValues.scheduleAutomaticBackups = $scope.formValues.cronRule ? true : false;
          $scope.formValues.passwordProtectS3 = $scope.formValues.passwordS3 ? true : false;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve S3 backup settings');
        });

      SettingsService.settings()
        .then(function success(data) {
          var settings = data;
          $scope.settings = settings;

          if (settings.LogoURL !== '') {
            $scope.formValues.customLogo = true;
          }
          $scope.formValues.enableEdgeComputeFeatures = settings.EnableEdgeComputeFeatures;
          $scope.formValues.enableTelemetry = settings.EnableTelemetry;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
        });
    }

    initView();
  },
]);
