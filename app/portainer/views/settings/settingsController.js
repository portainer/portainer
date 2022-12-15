import angular from 'angular';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
// import trackEvent directly because the event only fires once with $analytics.trackEvent
import { trackEvent } from '@/angulartics.matomo/analytics-services';
import { options } from './options';

angular.module('portainer.app').controller('SettingsController', [
  '$scope',
  '$analytics',
  '$state',
  'Notifications',
  'SettingsService',
  'ModalService',
  'StateManager',
  'BackupService',
  'FileSaver',
  'Blob',
  function ($scope, $analytics, $state, Notifications, SettingsService, ModalService, StateManager, BackupService, FileSaver) {
    $scope.customBannerFeatureId = FeatureId.CUSTOM_LOGIN_BANNER;
    $scope.s3BackupFeatureId = FeatureId.S3_BACKUP_SETTING;
    $scope.enforceDeploymentOptions = FeatureId.ENFORCE_DEPLOYMENT_OPTIONS;

    $scope.backupOptions = options;

    $scope.state = {
      isDemo: false,
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
      customLogo: false,
      ShowKomposeBuildOption: false,
      KubeconfigExpiry: undefined,
      HelmRepositoryURL: undefined,
      BlackListedLabels: [],
      labelName: '',
      labelValue: '',
      enableTelemetry: false,
      passwordProtect: false,
      password: '',
      backupFormType: $scope.BACKUP_FORM_TYPES.FILE,
    };

    $scope.initialFormValues = {};

    $scope.onToggleEnableTelemetry = function onToggleEnableTelemetry(checked) {
      $scope.$evalAsync(() => {
        $scope.formValues.enableTelemetry = checked;
      });
    };

    $scope.onToggleCustomLogo = function onToggleCustomLogo(checked) {
      $scope.$evalAsync(() => {
        $scope.formValues.customLogo = checked;
      });
    };

    $scope.onToggleShowKompose = async function onToggleShowKompose(checked) {
      if (checked) {
        ModalService.confirmWarn({
          title: 'Are you sure?',
          message: `<p>In a forthcoming Portainer release, we plan to remove support for docker-compose format manifests for Kubernetes deployments, and the Kompose conversion tool which enables this. The reason for this is because Kompose now poses a security risk, since it has a number of Common Vulnerabilities and Exposures (CVEs).</p>
              <p>Unfortunately, while the Kompose project has a maintainer and is part of the CNCF, it is not being actively maintained. Releases are very infrequent and new pull requests to the project (including ones we've submitted) are taking months to be merged, with new CVEs arising in the meantime.</p>`,
          buttons: {
            confirm: {
              label: 'Ok',
              className: 'btn-warning',
            },
          },
          callback: function (confirmed) {
            $scope.setShowCompose(confirmed);
          },
        });
        return;
      }
      $scope.setShowCompose(checked);
    };

    $scope.setShowCompose = function setShowCompose(checked) {
      return $scope.$evalAsync(() => {
        $scope.formValues.ShowKomposeBuildOption = checked;
      });
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

    $scope.onChangeCheckInInterval = function (interval) {
      $scope.$evalAsync(() => {
        var settings = $scope.settings;
        settings.EdgeAgentCheckinInterval = interval;
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

    // only update the values from the app settings widget. In future separate the api endpoints
    $scope.saveApplicationSettings = function () {
      const appSettingsPayload = {
        SnapshotInterval: $scope.settings.SnapshotInterval,
        LogoURL: $scope.formValues.customLogo ? $scope.settings.LogoURL : '',
        EnableTelemetry: $scope.formValues.enableTelemetry,
        TemplatesURL: $scope.settings.TemplatesURL,
        EdgeAgentCheckinInterval: $scope.settings.EdgeAgentCheckinInterval,
      };

      $scope.state.actionInProgress = true;
      updateSettings(appSettingsPayload, 'Application settings updated');
    };

    // only update the values from the kube settings widget. In future separate the api endpoints
    $scope.saveKubernetesSettings = function () {
      const kubeSettingsPayload = {
        KubeconfigExpiry: $scope.formValues.KubeconfigExpiry,
        HelmRepositoryURL: $scope.formValues.HelmRepositoryURL,
        GlobalDeploymentOptions: $scope.formValues.GlobalDeploymentOptions,
        ShowKomposeBuildOption: $scope.formValues.ShowKomposeBuildOption,
      };

      if (kubeSettingsPayload.ShowKomposeBuildOption !== $scope.initialFormValues.ShowKomposeBuildOption && $scope.initialFormValues.enableTelemetry) {
        trackEvent('kubernetes-allow-compose', { category: 'kubernetes', metadata: { 'kubernetes-allow-compose': kubeSettingsPayload.ShowKomposeBuildOption } });
      }

      $scope.state.kubeSettingsActionInProgress = true;
      updateSettings(kubeSettingsPayload, 'Kubernetes settings updated');
    };

    function updateSettings(settings, successMessage = 'Settings updated') {
      SettingsService.update(settings)
        .then(function success(response) {
          Notifications.success('Success', successMessage);
          StateManager.updateLogo(settings.LogoURL);
          StateManager.updateSnapshotInterval(settings.SnapshotInterval);
          StateManager.updateEnableTelemetry(settings.EnableTelemetry);
          $scope.initialFormValues.ShowKomposeBuildOption = response.ShowKomposeBuildOption;
          $scope.initialFormValues.enableTelemetry = response.EnableTelemetry;
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
      const state = StateManager.getState();
      $scope.state.isDemo = state.application.demoEnvironment.enabled;

      SettingsService.settings()
        .then(function success(data) {
          var settings = data;
          $scope.settings = settings;

          if (settings.LogoURL !== '') {
            $scope.formValues.customLogo = true;
          }

          $scope.formValues.enableTelemetry = settings.EnableTelemetry;
          $scope.formValues.KubeconfigExpiry = settings.KubeconfigExpiry;
          $scope.formValues.HelmRepositoryURL = settings.HelmRepositoryURL;
          $scope.formValues.BlackListedLabels = settings.BlackListedLabels;
          if (settings.ShowKomposeBuildOption) {
            $scope.formValues.ShowKomposeBuildOption = settings.ShowKomposeBuildOption;
          }

          $scope.initialFormValues.ShowKomposeBuildOption = settings.ShowKomposeBuildOption;
          $scope.initialFormValues.enableTelemetry = settings.EnableTelemetry;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
        });
    }

    initView();
  },
]);
